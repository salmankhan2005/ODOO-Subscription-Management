"""
app/utils/invoice_pdf.py — Generate PDF invoices using ReportLab.

Returns PDF bytes that can be streamed to the client.
"""
from __future__ import annotations

import io
from datetime import date
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER


PRIMARY = colors.HexColor('#6C47FF')
DARK = colors.HexColor('#1E1B2E')
LIGHT_GREY = colors.HexColor('#F4F4F8')
MID_GREY = colors.HexColor('#9CA3AF')


def generate_invoice_pdf(invoice: dict, customer: dict, company_name: str = 'Brightloop Software') -> bytes:
    """
    Generate a PDF invoice from the invoice dict and customer dict.
    Returns raw PDF bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    normal = styles['Normal']
    h1 = ParagraphStyle('H1', fontSize=22, textColor=PRIMARY, fontName='Helvetica-Bold')
    h2 = ParagraphStyle('H2', fontSize=12, textColor=DARK, fontName='Helvetica-Bold')
    small = ParagraphStyle('Small', fontSize=8, textColor=MID_GREY)
    right_bold = ParagraphStyle('RightBold', fontSize=10, alignment=TA_RIGHT, fontName='Helvetica-Bold')
    right_normal = ParagraphStyle('RightNormal', fontSize=10, alignment=TA_RIGHT)

    story = []

    # ── Header ────────────────────────────────────────────────────────────────
    header_data = [
        [
            Paragraph(company_name, h1),
            Paragraph(f"INVOICE<br/><font size='10'>{invoice.get('invoice_number', '')}</font>", right_bold),
        ]
    ]
    header_table = Table(header_data, colWidths=[100 * mm, 70 * mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width='100%', thickness=1, color=PRIMARY))
    story.append(Spacer(1, 6 * mm))

    # ── Bill-To / Meta ─────────────────────────────────────────────────────────
    bill_to = (
        f"<b>Bill To:</b><br/>"
        f"{customer.get('name', '')}<br/>"
        f"{customer.get('company_name', '')}<br/>"
        f"{customer.get('email', '')}<br/>"
        f"{customer.get('billing_address', '')}"
    )
    meta = (
        f"<b>Invoice Date:</b> {invoice.get('invoice_date', '')}<br/>"
        f"<b>Due Date:</b> {invoice.get('due_date', '')}<br/>"
        f"<b>Status:</b> {invoice.get('status', '').upper()}"
    )
    meta_data = [
        [Paragraph(bill_to, normal), Paragraph(meta, normal)]
    ]
    meta_table = Table(meta_data, colWidths=[100 * mm, 70 * mm])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8 * mm))

    # ── Line Items ─────────────────────────────────────────────────────────────
    col_headers = ['#', 'Description', 'Qty', 'Unit Price', 'Tax %', 'Discount', 'Total']
    line_rows = [col_headers]
    lines = invoice.get('lines', invoice.get('invoice_lines', []))
    for i, line in enumerate(lines, 1):
        line_rows.append([
            str(i),
            line.get('description', line.get('product_name', '')),
            str(line.get('quantity', 1)),
            f"${float(line.get('unit_price', 0)):,.2f}",
            f"{float(line.get('tax_percentage', 0)):.1f}%",
            f"${float(line.get('discount_amount', 0)):,.2f}",
            f"${float(line.get('line_total', 0)):,.2f}",
        ])

    col_widths = [8 * mm, 60 * mm, 14 * mm, 24 * mm, 16 * mm, 20 * mm, 24 * mm]
    line_table = Table(line_rows, colWidths=col_widths, repeatRows=1)
    line_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_GREY]),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.lightgrey),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 8 * mm))

    # ── Totals ─────────────────────────────────────────────────────────────────
    totals = [
        ['Subtotal', f"${float(invoice.get('subtotal', 0)):,.2f}"],
        ['Discount', f"-${float(invoice.get('discount_amount', 0)):,.2f}"],
        ['Tax', f"${float(invoice.get('tax_amount', 0)):,.2f}"],
        ['Total', f"${float(invoice.get('total_amount', 0)):,.2f}"],
        ['Amount Paid', f"${float(invoice.get('amount_paid', 0)):,.2f}"],
        ['Amount Due', f"${float(invoice.get('amount_due', 0)):,.2f}"],
    ]
    totals_table = Table(totals, colWidths=[120 * mm, 46 * mm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('LINEABOVE', (0, 3), (-1, 3), 1, PRIMARY),
        ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 3), (-1, 3), PRIMARY),
        ('FONTSIZE', (0, 3), (-1, 3), 11),
        ('LINEABOVE', (0, 5), (-1, 5), 1, DARK),
        ('FONTNAME', (0, 5), (-1, 5), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(totals_table)

    # ── Notes ──────────────────────────────────────────────────────────────────
    notes = invoice.get('notes', '')
    if notes:
        story.append(Spacer(1, 8 * mm))
        story.append(HRFlowable(width='100%', thickness=0.5, color=MID_GREY))
        story.append(Spacer(1, 3 * mm))
        story.append(Paragraph(f'<b>Notes:</b> {notes}', small))

    # ── Footer ─────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 10 * mm))
    story.append(HRFlowable(width='100%', thickness=0.5, color=MID_GREY))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        f'Thank you for your business — {company_name}',
        ParagraphStyle('Footer', fontSize=8, textColor=MID_GREY, alignment=TA_CENTER)
    ))

    doc.build(story)
    return buffer.getvalue()

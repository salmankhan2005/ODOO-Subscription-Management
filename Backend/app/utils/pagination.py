"""
app/utils/pagination.py — Pagination helper for list endpoints.
"""

from flask import request


def get_pagination_params(default_page: int = 1, default_per_page: int = 25,
                          max_per_page: int = 200) -> tuple[int, int, int]:
    """Return (page, per_page, offset)."""
    try:
        page = max(1, int(request.args.get('page', default_page)))
        per_page = min(max_per_page, max(1, int(request.args.get('per_page', default_per_page))))
    except (ValueError, TypeError):
        page, per_page = default_page, default_per_page
    offset = (page - 1) * per_page
    return page, per_page, offset


def build_pagination_meta(page: int, per_page: int, total: int) -> dict:
    total_pages = (total + per_page - 1) // per_page if per_page else 1
    return {
        'page': page,
        'per_page': per_page,
        'total': total,
        'total_pages': total_pages,
        'has_next': page < total_pages,
        'has_prev': page > 1,
    }

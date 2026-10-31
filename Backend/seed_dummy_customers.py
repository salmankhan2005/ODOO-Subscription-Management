"""
Seed 80 realistic dummy customers for Brightloop Subscription Management.
"""

import os
import random
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('Backend/.env')

supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Backend/.env")

sb = create_client(supabase_url, supabase_key)

first_names = [
    "Aarav", "Aditi", "Alexander", "Amara", "Ananya", "Anthony", "Arjun", "Benjamin",
    "Chloe", "Daniel", "Deepak", "Elena", "Emily", "Ethan", "Fatima", "Gabriel",
    "Gaurav", "Grace", "Hannah", "Harish", "Ibrahim", "Ishaan", "Jacob", "Jessica",
    "Karthik", "Kavita", "Liam", "Lucas", "Madhav", "Manish", "Maya", "Michael",
    "Naveen", "Neha", "Noah", "Olivia", "Pooja", "Pranav", "Priya", "Rahul",
    "Rajesh", "Ramesh", "Ravi", "Rohan", "Samantha", "Samuel", "Sanjay", "Sara",
    "Siddharth", "Sneha", "Sophia", "Suresh", "Tanvi", "Tara", "Thomas", "Varun",
    "Venkatesh", "Victoria", "Vikram", "William", "Yasmin", "Zack", "Zara", "Zoya",
    "Meera", "Swati", "Kunal", "Divya", "Alok", "Sunita", "Preeti", "Abhinav",
    "Shreya", "Roshan", "Nikhil", "Ashwin", "Devika", "Pavitra", "Gautam", "Tarun"
]

last_names = [
    "Patel", "Sharma", "Smith", "Johnson", "Verma", "Iyer", "Williams", "Brown",
    "Kumar", "Reddy", "Jones", "Miller", "Davis", "Wilson", "Nair", "Rao",
    "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson",
    "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee", "Walker",
    "Hall", "Allen", "Young", "Hernandez", "King", "Wright", "Lopez", "Hill",
    "Scott", "Green", "Adams", "Baker", "Gonzalez", "Nelson", "Carter", "Mitchell",
    "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards",
    "Collins", "Stewart", "Sanchez", "Morris", "Rogers", "Reed", "Cook", "Morgan",
    "Bell", "Murphy", "Bailey", "Rivera", "Cooper", "Richardson", "Cox", "Howard",
    "Ward", "Torres", "Peterson", "Gray", "Ramirez", "James", "Watson", "Brooks"
]

company_prefixes = [
    "Apex", "Nexus", "Vertex", "Quantum", "CloudZen", "Hyperion", "AeroSoft", "OmniTech",
    "Vanguard", "Pulse", "Synthetix", "Catalyst", "Zenith", "Aether", "InfiniCore", "Solstice",
    "Optima", "Starlight", "Novus", "BlueWave", "IronClad", "CoreLogic", "DataSphere", "EchoLogic",
    "Frontier", "GlobalNet", "Horizon", "InnoWave", "Krypton", "Lumina", "Metrix", "NextGen",
    "Onward", "PeakScale", "QuickPulse", "Radix", "Skyline", "Trident", "Unified", "Vector"
]

company_suffixes = [
    "Technologies", "Solutions", "Dynamics", "Systems", "Labs", "Digital", "Networks", "Cloud",
    "Analytics", "Software", "Holdings", "Enterprises", "Global", "Consulting", "Innovations", "Ventures"
]

cities = [
    ("San Francisco", "United States", "US"),
    ("New York", "United States", "US"),
    ("Austin", "United States", "US"),
    ("Seattle", "United States", "US"),
    ("Bengaluru", "India", "IN"),
    ("Hyderabad", "India", "IN"),
    ("Mumbai", "India", "IN"),
    ("Chennai", "India", "IN"),
    ("London", "United Kingdom", "GB"),
    ("Manchester", "United Kingdom", "GB"),
    ("Berlin", "Germany", "DE"),
    ("Munich", "Germany", "DE"),
    ("Singapore", "Singapore", "SG"),
    ("Toronto", "Canada", "CA"),
    ("Sydney", "Australia", "AU"),
    ("Dubai", "United Arab Emirates", "AE"),
]

# Fetch existing customer emails to avoid collisions
existing = sb.table('customers').select('email').execute().data or []
existing_emails = {row['email'].lower() for row in existing}

customers = []
random.seed(42)

for i in range(80):
    first = first_names[i % len(first_names)]
    last = last_names[i % len(last_names)]
    full_name = f"{first} {last}"

    comp_p = company_prefixes[i % len(company_prefixes)]
    comp_s = company_suffixes[(i * 3 + 7) % len(company_suffixes)]
    company_name = f"{comp_p} {comp_s}"
    domain = comp_p.lower() + random.choice(["tech.com", "cloud.io", "systems.net", "solutions.co"])

    email = f"{first.lower()}.{last.lower()}{i+1}@{domain}"
    if email in existing_emails:
        email = f"{first.lower()}_{last.lower()}_{random.randint(100, 999)}@{domain}"
    existing_emails.add(email)

    city, country, code = cities[i % len(cities)]
    street_no = random.randint(10, 999)
    suite_no = random.randint(100, 800)
    street_names = ["Market St", "Tech Park Blvd", "Innovation Way", "High Street", "Silicon Ave", "Cyber Way"]
    billing_address = f"{street_no} {random.choice(street_names)}, Suite {suite_no}, {city}"

    phone = f"+{random.choice(['1', '44', '49', '91', '65', '61'])}-{random.randint(200, 999)}-{random.randint(100000, 999999)}"
    tax_id = f"{code}-{random.randint(10000000, 99999999)}"

    # ~90% active, ~10% inactive
    status = "active" if random.random() > 0.12 else "inactive"

    customers.append({
        "name": full_name,
        "email": email,
        "phone": phone,
        "company_name": company_name,
        "billing_address": billing_address,
        "country": country,
        "tax_id": tax_id,
        "status": status,
    })

print(f"Prepared {len(customers)} dummy customer records. Inserting in batches...")

# Insert in chunks of 20
batch_size = 20
inserted_total = 0
for start in range(0, len(customers), batch_size):
    batch = customers[start:start + batch_size]
    res = sb.table('customers').insert(batch).execute()
    inserted_total += len(res.data)
    print(f"Inserted batch {start // batch_size + 1}/{(len(customers) + batch_size - 1) // batch_size}: {len(res.data)} records")

print(f"Successfully seeded {inserted_total} dummy customers!")


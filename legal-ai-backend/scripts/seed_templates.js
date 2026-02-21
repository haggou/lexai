
import { MongoClient } from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/legal-ai";

const TEMPLATES = [
    {
        title: "Residential Rental Agreement",
        category: "Real Estate",
        isPremium: false,
        content: `## RESIDENTIAL RENTAL AGREEMENT

This Rental Agreement ("Agreement") is made on **[DATE]** between:

**LANDLORD:** [Landlord Name], residing at [Landlord Address].
**TENANT:** [Tenant Name], residing at [Tenant Address].

### 1. PROPERTY
The Landlord agrees to rent to the Tenant the property located at:
**[Property Address]**

### 2. TERM
The lease shall commence on **[Start Date]** and end on **[End Date]**.

### 3. RENT
The monthly rent shall be **₹[Amount]**, payable on the **[Day]** of each month.

### 4. SECURITY DEPOSIT
The Tenant agrees to pay a security deposit of **₹[Deposit Amount]** to be held by the Landlord.

### 5. RULES & REGULATIONS
- No illegal activities.
- No pets without prior approval.
- Tenant is responsible for minor repairs (bulbs, taps).

**SIGNED:**

______________________          ______________________
Landlord Signature              Tenant Signature
`,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        title: "Freelance Service Contract",
        category: "Business",
        isPremium: true,
        content: `## FREELANCE SERVICE CONTRACT

**CLIENT:** [Client Name]
**FREELANCER:** [Freelancer Name]
**DATE:** [Date]

### 1. SERVICES
The Freelancer agrees to provide the following services:
- [Service Description 1]
- [Service Description 2]

### 2. PAYMENT
The Client agrees to pay the Freelancer a total fee of **₹[Total Fee]**.
Payment Terms: 50% upfront, 50% upon completion.

### 3. COPYRIGHT
The Freelancer assigns all rights to the work produced to the Client upon full payment.

### 4. CONFIDENTIALITY
The Freelancer agrees not to disclose any proprietary information shared by the Client.

**AGREED:**

______________________          ______________________
Client                          Freelancer
`,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

async function seed() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();
        const templates = db.collection('templates');

        const count = await templates.countDocuments();
        if (count === 0) {
            console.log("Creating default templates...");
            await templates.insertMany(TEMPLATES);
            console.log("✅ Added 2 Templates.");
        } else {
            console.log(`ℹ️ Templates already exist (${count}). Skipping seed.`);
        }

    } catch (error) {
        console.error("Seed Error:", error);
    } finally {
        await client.close();
    }
}

seed();

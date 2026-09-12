import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "../src/database/generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DECIMAL = Prisma.Decimal;

const DEMO_FAMILY_ID = "00000000-0000-0000-0000-000000000001";
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000002";
const PARTNER_USER_ID = "00000000-0000-0000-0000-000000000003";

const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

const toDateOnly = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

async function clearDemoData(): Promise<void> {
  const accountIds = (
    await prisma.account.findMany({
      where: { familyId: DEMO_FAMILY_ID },
      select: { id: true },
    })
  ).map((a) => a.id);

  const transactionIds = (
    await prisma.entry.findMany({
      where: { accountId: { in: accountIds } },
      select: { entryableId: true },
    })
  )
    .map((e) => e.entryableId)
    .filter((id): id is string => id !== null);

  await prisma.$transaction([
    prisma.budgetShare.deleteMany({ where: { ownerId: DEMO_USER_ID } }),
    prisma.goalPledge.deleteMany({ where: { accountId: { in: accountIds } } }),
    prisma.goalAccount.deleteMany({ where: { accountId: { in: accountIds } } }),
    prisma.goal.deleteMany({ where: { familyId: DEMO_FAMILY_ID } }),
    prisma.budgetCategory.deleteMany({ where: { budget: { familyId: DEMO_FAMILY_ID } } }),
    prisma.budget.deleteMany({ where: { familyId: DEMO_FAMILY_ID } }),
    prisma.entry.deleteMany({ where: { accountId: { in: accountIds } } }),
    prisma.transaction.deleteMany({ where: { id: { in: transactionIds } } }),
    prisma.accountShare.deleteMany({ where: { accountId: { in: accountIds } } }),
    prisma.balance.deleteMany({ where: { accountId: { in: accountIds } } }),
    prisma.holding.deleteMany({ where: { accountId: { in: accountIds } } }),
    prisma.account.deleteMany({ where: { familyId: DEMO_FAMILY_ID } }),
    prisma.category.deleteMany({ where: { familyId: DEMO_FAMILY_ID } }),
    prisma.merchant.deleteMany({ where: { familyId: DEMO_FAMILY_ID } }),
    prisma.session.deleteMany({ where: { userId: { in: [DEMO_USER_ID, PARTNER_USER_ID] } } }),
    prisma.user.deleteMany({ where: { familyId: DEMO_FAMILY_ID } }),
    prisma.family.deleteMany({ where: { id: DEMO_FAMILY_ID } }),
  ]);
}

type SeedCategory = { name: string; color: string; icon: string; classification: string };

type SeedMerchant = { name: string; type: string; key: string };

type SeedEntry = { account: string; amount: string; name: string };

type SeedTransaction = {
  daysAgo: number;
  entries: SeedEntry[];
  merchantKey?: string;
  category?: string;
};

const SEED_CATEGORIES: SeedCategory[] = [
  { name: "Housing", color: "#2563eb", icon: "home", classification: "expense" },
  { name: "Groceries", color: "#16a34a", icon: "shopping-cart", classification: "expense" },
  { name: "Dining", color: "#ea580c", icon: "utensils", classification: "expense" },
  { name: "Transportation", color: "#dc2626", icon: "car", classification: "expense" },
  { name: "Utilities", color: "#eab308", icon: "zap", classification: "expense" },
  { name: "Healthcare", color: "#db2777", icon: "heart-pulse", classification: "expense" },
  { name: "Entertainment", color: "#9333ea", icon: "clapperboard", classification: "expense" },
  { name: "Shopping", color: "#0d9488", icon: "shopping-bag", classification: "expense" },
  { name: "Subscriptions", color: "#64748b", icon: "repeat", classification: "expense" },
  { name: "Income", color: "#22c55e", icon: "banknote", classification: "income" },
];

const SEED_MERCHANTS: SeedMerchant[] = [
  { key: "wholeFoods", name: "Whole Foods Market", type: "grocery" },
  { key: "amazon", name: "Amazon", type: "retail" },
  { key: "shell", name: "Shell", type: "gas_station" },
  { key: "netflix", name: "Netflix", type: "subscription" },
  { key: "verizon", name: "Verizon", type: "telecom" },
  { key: "acmeCorp", name: "Acme Corp", type: "employer" },
];

const SEED_TRANSACTIONS: SeedTransaction[] = [
  {
    daysAgo: 0,
    merchantKey: "wholeFoods",
    category: "Groceries",
    entries: [{ account: "checking", amount: "-86.42", name: "Whole Foods Market" }],
  },
  {
    daysAgo: 2,
    merchantKey: "acmeCorp",
    category: "Income",
    entries: [{ account: "checking", amount: "5000.00", name: "Acme Corp Payroll" }],
  },
  {
    daysAgo: 4,
    merchantKey: "amazon",
    category: "Shopping",
    entries: [{ account: "credit", amount: "-120.15", name: "Amazon Purchase" }],
  },
  {
    daysAgo: 5,
    entries: [
      { account: "checking", amount: "-500.00", name: "Transfer to Savings" },
      { account: "savings", amount: "500.00", name: "Transfer from Checking" },
    ],
  },
  {
    daysAgo: 8,
    merchantKey: "shell",
    category: "Transportation",
    entries: [{ account: "checking", amount: "-54.30", name: "Shell Station" }],
  },
  {
    daysAgo: 10,
    merchantKey: "netflix",
    category: "Subscriptions",
    entries: [{ account: "credit", amount: "-15.49", name: "Netflix" }],
  },
  {
    daysAgo: 12,
    merchantKey: "verizon",
    category: "Utilities",
    entries: [{ account: "checking", amount: "-89.99", name: "Verizon Wireless" }],
  },
  {
    daysAgo: 15,
    merchantKey: "acmeCorp",
    category: "Income",
    entries: [{ account: "checking", amount: "5000.00", name: "Acme Corp Payroll" }],
  },
  {
    daysAgo: 18,
    merchantKey: "wholeFoods",
    category: "Groceries",
    entries: [{ account: "checking", amount: "-132.74", name: "Whole Foods Market" }],
  },
  {
    daysAgo: 20,
    merchantKey: "amazon",
    category: "Shopping",
    entries: [{ account: "credit", amount: "-64.99", name: "Amazon Purchase" }],
  },
  {
    daysAgo: 27,
    merchantKey: "shell",
    category: "Transportation",
    entries: [{ account: "checking", amount: "-61.05", name: "Shell Station" }],
  },
  {
    daysAgo: 30,
    merchantKey: "acmeCorp",
    category: "Income",
    entries: [{ account: "checking", amount: "5000.00", name: "Acme Corp Payroll" }],
  },
  {
    daysAgo: 32,
    merchantKey: "verizon",
    category: "Utilities",
    entries: [{ account: "checking", amount: "-89.99", name: "Verizon Wireless" }],
  },
  {
    daysAgo: 35,
    merchantKey: "netflix",
    category: "Subscriptions",
    entries: [{ account: "credit", amount: "-15.49", name: "Netflix" }],
  },
  {
    daysAgo: 40,
    merchantKey: "wholeFoods",
    category: "Groceries",
    entries: [{ account: "checking", amount: "-98.20", name: "Whole Foods Market" }],
  },
  {
    daysAgo: 42,
    merchantKey: "amazon",
    category: "Shopping",
    entries: [{ account: "credit", amount: "-40.10", name: "Amazon Purchase" }],
  },
];

const BUDGET_LIMITS: Record<string, string> = {
  Housing: "2400.00",
  Groceries: "600.00",
  Dining: "400.00",
  Transportation: "300.00",
  Utilities: "300.00",
  Healthcare: "200.00",
  Entertainment: "150.00",
  Shopping: "300.00",
  Subscriptions: "100.00",
};

async function seedDemo(): Promise<void> {
  const passwordHash = await bcrypt.hash("password", 10);

  const family = await prisma.family.create({
    data: {
      id: DEMO_FAMILY_ID,
      name: "Demo Family",
      moniker: "The Demo Harrisons",
      country: "US",
      currency: "USD",
      dateFormat: "%m-%d-%Y",
      defaultAccountSharing: "shared",
      householdBudgetEnabled: true,
      locale: "en",
      monthStartDay: 1,
      timezone: "America/New_York",
      autoSyncOnLogin: true,
    },
  });

  const owner = await prisma.user.create({
    data: {
      id: DEMO_USER_ID,
      familyId: family.id,
      email: "demo@example.com",
      firstName: "Alex",
      lastName: "Harrison",
      passwordDigest: passwordHash,
      role: "owner",
      onboardedAt: daysAgo(200),
      lastLoginAt: daysAgo(1),
      locale: "en",
      defaultPeriod: "last_30_days",
      theme: "system",
      preferences: {},
    },
  });

  const partner = await prisma.user.create({
    data: {
      id: PARTNER_USER_ID,
      familyId: family.id,
      email: "demo+partner@example.com",
      firstName: "Taylor",
      lastName: "Harrison",
      passwordDigest: passwordHash,
      role: "member",
      onboardedAt: daysAgo(190),
      locale: "en",
    },
  });

  const categories: Record<string, string> = {};
  for (const c of SEED_CATEGORIES) {
    const created = await prisma.category.create({
      data: {
        familyId: family.id,
        name: c.name,
        color: c.color,
        lucideIcon: c.icon,
        classificationUnused: c.classification,
      },
    });
    categories[c.name] = created.id;
  }

  const merchants: Record<string, string> = {};
  for (const m of SEED_MERCHANTS) {
    const created = await prisma.merchant.create({
      data: { familyId: family.id, name: m.name, type: m.type },
    });
    merchants[m.key] = created.id;
  }

  const depository = await prisma.depository.create({ data: {} });
  const creditCard = await prisma.creditCard.create({ data: {} });
  const loan = await prisma.loan.create({ data: {} });
  const investment = await prisma.investment.create({ data: {} });

  const checking = await prisma.account.create({
    data: {
      familyId: family.id,
      ownerId: owner.id,
      name: "Chase Total Checking",
      currency: "USD",

      accountableType: "Depository",
      accountableId: depository.id,
      cashBalance: new DECIMAL("4500.00"),
      status: "active",
    },
  });
  const savings = await prisma.account.create({
    data: {
      familyId: family.id,
      ownerId: owner.id,
      name: "Chase Savings",
      currency: "USD",

      accountableType: "Depository",
      accountableId: depository.id,
      cashBalance: new DECIMAL("12500.00"),
      status: "active",
    },
  });
  const credit = await prisma.account.create({
    data: {
      familyId: family.id,
      ownerId: owner.id,
      name: "Chase Sapphire Card",
      currency: "USD",

      accountableType: "CreditCard",
      accountableId: creditCard.id,
      cashBalance: new DECIMAL("-200.00"),
      status: "active",
    },
  });
  const brokerage = await prisma.account.create({
    data: {
      familyId: family.id,
      ownerId: owner.id,
      name: "Vanguard Brokerage",
      currency: "USD",

      accountableType: "Investment",
      accountableId: investment.id,
      cashBalance: new DECIMAL("50000.00"),
      status: "active",
    },
  });
  const mortgage = await prisma.account.create({
    data: {
      familyId: family.id,
      ownerId: owner.id,
      name: "House Loan",
      currency: "USD",

      accountableType: "Loan",
      accountableId: loan.id,
      cashBalance: new DECIMAL("-275000.00"),
      status: "active",
    },
  });

  const accounts: Record<string, string> = {
    checking: checking.id,
    savings: savings.id,
    credit: credit.id,
    brokerage: brokerage.id,
    mortgage: mortgage.id,
  };

  await prisma.accountShare.createMany({
    data: [
      { accountId: checking.id, userId: partner.id, includeInFinances: true },
      { accountId: savings.id, userId: partner.id, includeInFinances: true },
      { accountId: credit.id, userId: partner.id, includeInFinances: true },
      { accountId: brokerage.id, userId: partner.id, includeInFinances: true },
    ],
  });

  for (const t of SEED_TRANSACTIONS) {
    const tx = await prisma.transaction.create({
      data: {
        kind: "standard",
        categoryId: t.category ? categories[t.category] : undefined,
        merchantId: t.merchantKey ? merchants[t.merchantKey] : undefined,
      },
    });
    await prisma.entry.createMany({
      data: t.entries.map((e) => ({
        accountId: accounts[e.account],
        amount: new DECIMAL(e.amount),
        name: e.name,
        date: toDateOnly(daysAgo(t.daysAgo)),
        currency: "USD",
        entryableType: "Transaction",
        entryableId: tx.id,
      })),
    });
  }

  const balances: Record<string, string> = {
    checking: "4500.00",
    savings: "12500.00",
    credit: "-200.00",
    brokerage: "50000.00",
    mortgage: "-275000.00",
  };
  for (const [key, id] of Object.entries(accounts)) {
    for (let i = 0; i < 90; i += 30) {
      await prisma.balance.create({
        data: {
          accountId: id,
          date: toDateOnly(daysAgo(i)),
          currency: "USD",
          balance: new DECIMAL(balances[key]),
          cashBalance: new DECIMAL(balances[key]),
        },
      });
    }
  }

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const monthEnd = new Date(nextMonthStart.getTime() - 1);

  const budget = await prisma.budget.create({
    data: {
      familyId: family.id,
      userId: owner.id,
      currency: "USD",
      startDate: monthStart,
      endDate: monthEnd,
      budgetedSpending: new DECIMAL("3650.00"),
      expectedIncome: new DECIMAL("10000.00"),
    },
  });

  await prisma.budgetCategory.createMany({
    data: Object.entries(BUDGET_LIMITS).map(([name, amount]) => ({
      budgetId: budget.id,
      categoryId: categories[name],
      budgetedSpending: new DECIMAL(amount),
      currency: "USD",
    })),
  });

  const emergencyGoal = await prisma.goal.create({
    data: {
      familyId: family.id,
      name: "Emergency Fund",
      kind: "one_off",
      targetAmount: new DECIMAL("20000.00"),
      targetMode: "fixed",
      progressBasis: "balance",
      state: "active",
      currency: "USD",
      color: "#16a34a",
      icon: "life-buoy",
    },
  });

  await prisma.goalAccount.create({
    data: {
      goalId: emergencyGoal.id,
      accountId: savings.id,
      allocatedAmount: new DECIMAL("12500.00"),
    },
  });

  const mortgageGoal = await prisma.goal.create({
    data: {
      familyId: family.id,
      name: "Pay off mortgage",
      kind: "maintained",
      targetAmount: new DECIMAL("275000.00"),
      targetMode: "fixed",
      progressBasis: "contributions",
      state: "active",
      currency: "USD",
      color: "#2563eb",
      icon: "home",
    },
  });

  await prisma.goalAccount.create({
    data: {
      goalId: mortgageGoal.id,
      accountId: mortgage.id,
    },
  });

  console.log(`Seeded demo family "${family.name}" (${family.id})`);
  console.log("  login:   demo@example.com / password");
  console.log("  partner: demo+partner@example.com / password");
}

async function main(): Promise<void> {
  await clearDemoData();
  await seedDemo();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export {};

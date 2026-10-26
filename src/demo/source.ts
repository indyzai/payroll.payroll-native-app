export const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export type Employee = {
  id: string;
  name: string;
  dept: string;
  role: string;
  ctc: number;
  status: "Active" | "On Notice" | "Exited";
  pan: string;
  joined: string;
};

export const employees: Employee[] = [
  {
    id: "IZ001",
    name: "Aarav Sharma",
    dept: "Engineering",
    role: "Senior Engineer",
    ctc: 2400000,
    status: "Active",
    pan: "ABCPS1234K",
    joined: "2021-04-12",
  },
  {
    id: "IZ002",
    name: "Priya Nair",
    dept: "Design",
    role: "Product Designer",
    ctc: 1600000,
    status: "Active",
    pan: "BCDPN2345L",
    joined: "2022-01-03",
  },
  {
    id: "IZ003",
    name: "Rohan Mehta",
    dept: "Sales",
    role: "Account Executive",
    ctc: 1100000,
    status: "Active",
    pan: "CDEPM3456M",
    joined: "2020-08-21",
  },
  {
    id: "IZ004",
    name: "Sneha Iyer",
    dept: "Finance",
    role: "Payroll Analyst",
    ctc: 1300000,
    status: "Active",
    pan: "DEFPI4567N",
    joined: "2019-11-15",
  },
  {
    id: "IZ005",
    name: "Kabir Singh",
    dept: "Engineering",
    role: "DevOps Lead",
    ctc: 2800000,
    status: "On Notice",
    pan: "EFGPS5678P",
    joined: "2018-06-01",
  },
  {
    id: "IZ006",
    name: "Ananya Rao",
    dept: "HR",
    role: "HR Business Partner",
    ctc: 1400000,
    status: "Active",
    pan: "FGHPR6789Q",
    joined: "2023-02-20",
  },
  {
    id: "IZ007",
    name: "Vikram Joshi",
    dept: "Sales",
    role: "Regional Manager",
    ctc: 2100000,
    status: "Active",
    pan: "GHIPJ7890R",
    joined: "2017-09-09",
  },
  {
    id: "IZ008",
    name: "Meera Kapoor",
    dept: "Engineering",
    role: "QA Engineer",
    ctc: 1200000,
    status: "Exited",
    pan: "HIJPK8901S",
    joined: "2021-12-01",
  },
];

export const breakdown = (ctc: number) => {
  const m = ctc / 12;
  const basic = m * 0.5,
    hra = m * 0.2,
    special = m * 0.3;
  const pf = Math.min(basic * 0.12, 1800),
    pt = 200,
    tds = m * 0.08;
  const gross = basic + hra + special,
    ded = pf + pt + tds;
  return { basic, hra, special, gross, pf, pt, tds, ded, net: gross - ded };
};

export const approvalsSeed = [
  {
    id: 1,
    type: "Salary Change",
    who: "Priya Nair",
    detail: "Revision 16L → 18L",
    level: "L2 · Finance",
  },
  {
    id: 2,
    type: "Salary Change",
    who: "Rohan Mehta",
    detail: "Promotion hike 12%",
    level: "L1 · Manager",
  },
  {
    id: 3,
    type: "Reimbursement",
    who: "Aarav Sharma",
    detail: "Travel claim ₹12,400",
    level: "L1 · Manager",
  },
  {
    id: 4,
    type: "Leave Settlement",
    who: "Kabir Singh",
    detail: "Encash 14 days",
    level: "L2 · HR",
  },
  {
    id: 5,
    type: "Salary Change",
    who: "Sneha Iyer",
    detail: "Arrears ₹22,000",
    level: "L2 · Finance",
  },
];

export const compliance = [
  {
    name: "Provident Fund (PF)",
    due: "15 Nov 2026",
    amount: 182400,
    status: "Filed",
  },
  { name: "ESI", due: "15 Nov 2026", amount: 18650, status: "Filed" },
  {
    name: "TDS (Form 24Q)",
    due: "07 Nov 2026",
    amount: 1046000,
    status: "Pending",
  },
  {
    name: "Professional Tax",
    due: "20 Nov 2026",
    amount: 31200,
    status: "Scheduled",
  },
];

export const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
export const payrollTrend = [118, 121, 124, 123, 129, 134]; // lakhs

export const payslips = [
  "Oct 2026",
  "Sep 2026",
  "Aug 2026",
  "Jul 2026",
  "Jun 2026",
  "May 2026",
];

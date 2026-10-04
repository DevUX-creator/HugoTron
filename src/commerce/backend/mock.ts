/**
 * THE MOCK BACKEND: a complete, in-memory implementation of the contract, so every flow (guest
 * and account checkout, payment success and failure, order history, address editing) works on
 * a fresh clone without any service. It is also the reference for a real implementation:
 * each method shows what the site expects back.
 *
 * Data lives in process memory (kept across hot reloads on `globalThis`) and is lost on
 * restart. Demo account: demo@hugo-tron.test / demo1234 (two orders: one on its way, one
 * delivered). Vouchers: WELCOME10 (10 % off), FREESHIP (shipping off, as a fixed 4.90 €).
 *
 * NEVER select this backend in production: passwords are compared in plain text and anyone
 * can read any order by reference.
 */
import { COMMERCE } from "../config";
import { readDevSettings } from "../dev/settings";
import type { CommerceBackend } from "./contracts";
import type { Address, Customer, Order } from "../types";

type StoredCustomer = Customer & { password: string };
type Store = {
  customers: Map<string, StoredCustomer>;
  sessions: Map<string, string>;
  orders: Map<string, Order>;
  attempts: Map<string, { fingerprint: string; reference: string }>;
};

const DEMO_ADDRESS: Address = {
  firstName: "Ada",
  lastName: "Demo",
  company: "",
  street: "Friesenweg 2b",
  addition: "",
  postcode: "22763",
  city: "Hamburg",
  country: "DE",
  phone: "",
};

function seed(): Store {
  const demo: StoredCustomer = {
    id: "cus_demo",
    email: "demo@hugo-tron.test",
    password: "demo1234",
    firstName: "Ada",
    lastName: "Demo",
    address: DEMO_ADDRESS,
    createdAt: "2026-01-12T09:00:00.000Z",
  };
  const order = (
    reference: string,
    status: Order["status"],
    placedAt: string,
    lines: Order["lines"],
    shipping: number,
  ): Order => {
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const total = subtotal + shipping;
    return {
      reference,
      status,
      placedAt,
      locale: "de",
      customerId: demo.id,
      email: demo.email,
      lines,
      totals: {
        subtotal,
        shipping,
        discount: 0,
        total,
        vatIncluded: Math.round(total - total / 1.07),
      },
      voucher: null,
      note: "",
      shippingMethod: "standard",
      paymentMethod: "paypal",
      shippingAddress: DEMO_ADDRESS,
      billingAddress: DEMO_ADDRESS,
      // No carrier is confirmed yet, so the demo orders carry no tracking link.
      tracking: null,
    };
  };
  const orders = [
    order(
      "HT-260928-7KQ2",
      "shipped",
      "2026-09-28T14:12:00.000Z",
      [
        {
          productId: "pardis-1121-basmati-indien",
          quantity: 2,
          unit: "kg5",
          unitPrice: 1890,
          lineTotal: 3780,
        },
        {
          productId: "premium-negin-safran",
          quantity: 1,
          unit: "g1",
          unitPrice: 490,
          lineTotal: 490,
        },
      ],
      0,
    ),
    order(
      "HT-260611-3MX8",
      "delivered",
      "2026-06-11T08:40:00.000Z",
      [
        {
          productId: "aladdin-basmati-pakistan-1kg",
          quantity: 3,
          unit: "kg1",
          unitPrice: 490,
          lineTotal: 1470,
        },
      ],
      0,
    ),
  ];
  return {
    customers: new Map([[demo.email, demo]]),
    sessions: new Map(),
    orders: new Map(orders.map((item) => [item.reference, item])),
    attempts: new Map(),
  };
}

const memory = globalThis as typeof globalThis & { __hugoCommerce?: Store };
const store = (memory.__hugoCommerce ??= seed());
store.attempts ??= new Map(); // HMR compatibility with a store from before retry protection.

const token = () => `ses_${crypto.randomUUID()}`;
const publicCustomer = ({ password: _password, ...customer }: StoredCustomer): Customer => customer;
const byId = (id: string) => [...store.customers.values()].find((item) => item.id === id);

export const mockBackend: CommerceBackend = {
  auth: {
    async signIn(email, password) {
      const customer = store.customers.get(email.toLowerCase());
      if (!customer || customer.password !== password) return null;
      const session = token();
      store.sessions.set(session, customer.id);
      return session;
    },
    async register({ email, password, firstName, lastName }) {
      const key = email.toLowerCase();
      if (store.customers.has(key)) return null;
      const customer: StoredCustomer = {
        id: `cus_${crypto.randomUUID().slice(0, 8)}`,
        email: key,
        password,
        firstName,
        lastName,
        address: null,
        createdAt: new Date().toISOString(),
      };
      store.customers.set(key, customer);
      const session = token();
      store.sessions.set(session, customer.id);
      return session;
    },
    async startSocial(provider, state) {
      // A real provider returns its OAuth authorisation URL. The mock goes straight to the
      // callback, which signs the demo customer in.
      const callback = new URLSearchParams({ state, code: "mock" });
      return `/api/commerce/auth/${provider}/callback?${callback}`;
    },
    async completeSocial(_provider, params) {
      if (params.get("code") !== "mock") return null;
      const session = token();
      store.sessions.set(session, "cus_demo");
      return session;
    },
    async requestPasswordReset(email) {
      console.info(`[commerce:mock] password reset requested for ${email} (no email sent)`);
    },
    async customer(session) {
      const id = store.sessions.get(session);
      const customer = id ? byId(id) : undefined;
      return customer ? publicCustomer(customer) : null;
    },
    async signOut(session) {
      store.sessions.delete(session);
    },
  },

  customers: {
    async updateAddress(customerId, address) {
      const customer = byId(customerId);
      if (!customer) throw new Error("Unknown customer");
      customer.address = address;
      return publicCustomer(customer);
    },
  },

  orders: {
    async create(order, attempt) {
      const previous = store.attempts.get(attempt.key);
      if (previous) {
        if (previous.fingerprint !== attempt.fingerprint) throw new Error("Checkout input changed");
        return store.orders.get(previous.reference)!;
      }
      if (store.orders.has(order.reference)) throw new Error("Duplicate order reference");
      store.orders.set(order.reference, order);
      store.attempts.set(attempt.key, {
        fingerprint: attempt.fingerprint,
        reference: order.reference,
      });
      return order;
    },
    async get(reference) {
      return store.orders.get(reference) ?? null;
    },
    async listForCustomer(customerId) {
      return [...store.orders.values()]
        .filter((order) => order.customerId === customerId)
        .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
    },
    async setStatus(reference, status) {
      const order = store.orders.get(reference);
      if (order) order.status = status;
    },
  },

  payments: {
    async start(order) {
      if (order.status === "paid") return { kind: "paid" };
      if (order.paymentMethod === "prepayment") {
        await mockBackend.orders.setStatus(order.reference, "awaiting_transfer");
        return {
          kind: "instructions",
          reference: order.reference,
          bank: COMMERCE.bankTransfer,
        };
      }
      // The dev switcher decides how the simulated provider answers.
      const { payment } = await readDevSettings();
      if (payment === "fail") return { kind: "failed", reason: "declined" };
      await mockBackend.orders.setStatus(order.reference, "paid");
      return { kind: "paid" };
    },
    async handleWebhook() {
      return true;
    },
  },

  withdrawals: {
    async submit(declaration) {
      const receipt = { ...declaration, receivedAt: new Date().toISOString() };
      console.info("[commerce:mock] withdrawal received (no email sent):", receipt);
      return receipt;
    },
  },

  vouchers: {
    async lookup(code, subtotal) {
      const normalised = code.trim().toUpperCase();
      if (normalised === "WELCOME10") {
        return { code: normalised, discount: Math.round(subtotal * 0.1), label: "−10 %" };
      }
      if (normalised === "FREESHIP") return { code: normalised, discount: 490, label: "4,90 €" };
      return null;
    },
  },
};

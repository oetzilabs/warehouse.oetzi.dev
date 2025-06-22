import { action, json, query, redirect } from "@solidjs/router";
import {
  CustomerCreateSchema,
  CustomerUpdateSchema,
} from "@warehouseoetzidev/core/src/drizzle/sql/schemas/customers/customers";
import { CustomerLive, CustomerService } from "@warehouseoetzidev/core/src/entities/customers";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { Effect, Layer } from "effect";
import { InferInput } from "valibot";
import { getAuthenticatedUser } from "./auth";
import { withSession } from "./session";

export const getCustomers = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const session = auth[1];
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const customers = await Effect.runPromise(
    Effect.gen(function* (_) {
      const customerService = yield* _(CustomerService);
      const customers = yield* customerService.findByOrganizationId(orgId);
      return customers;
    }).pipe(Effect.provide(CustomerLive)),
  );
  return customers;
}, "customers-by-organization");

export const getCustomerById = query(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const session = auth[1];
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const organizationId = Layer.succeed(OrganizationId, orgId);

  const customer = await Effect.runPromise(
    Effect.gen(function* (_) {
      const customerService = yield* _(CustomerService);
      const customer = yield* customerService.findById(id);
      if (!customer) {
        throw redirect(`/customers/${id}`, { status: 404, statusText: "Not Found" });
      }

      const orders = yield* customerService.getOrdersByCustomerId(customer.id);

      return {
        customer,
        orders,
      };
    }).pipe(Effect.provide(CustomerLive), Effect.provide(organizationId)),
  );
  return customer;
}, "customer-by-id");

export const createCustomer = action(async (data: Omit<InferInput<typeof CustomerCreateSchema>, "id">) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const session = auth[1];
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const organizationId = Layer.succeed(OrganizationId, orgId);

  const customer = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CustomerService);
      return yield* service.create(data);
    }).pipe(Effect.provide(CustomerLive), Effect.provide(organizationId)),
  );
  return json(customer, {
    revalidate: [getAuthenticatedUser.key, getCustomers.key],
    headers: {
      Location: `/customers/${customer.id}`,
    },
    status: 303,
  });
});

export const updateCustomer = action(async (data: InferInput<typeof CustomerUpdateSchema>) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const customer = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CustomerService);
      return yield* service.update(data);
    }).pipe(Effect.provide(CustomerLive)),
  );
  return customer;
});

export const deleteCustomer = action(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const customer = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CustomerService);
      return yield* service.safeRemove(id);
    }).pipe(Effect.provide(CustomerLive)),
  );
  return customer;
});

export const addPreferredPickupTime = action(
  async (input: { customerId: string; startTime: Date; endTime?: Date; notes?: string }) => {
    "use server";
    const auth = await withSession();
    if (!auth) throw redirect("/", { status: 403, statusText: "Forbidden" });

    return await Effect.runPromise(
      Effect.gen(function* (_) {
        const service = yield* _(CustomerService);
        return yield* service.addPreferredPickupDateTime(
          {
            startTime: input.startTime,
            endTime: input.endTime,
            notes: input.notes,
          },
          input.customerId,
        );
      }).pipe(Effect.provide(CustomerLive)),
    );
  },
);

export const addPreferredDeliveryTime = action(
  async (input: { customerId: string; startTime: Date; endTime?: Date; notes?: string }) => {
    "use server";
    const auth = await withSession();
    if (!auth) throw redirect("/", { status: 403, statusText: "Forbidden" });

    return await Effect.runPromise(
      Effect.gen(function* (_) {
        const service = yield* _(CustomerService);
        return yield* service.addPreferredDeliveryDateTime(
          {
            startTime: input.startTime,
            endTime: input.endTime,
            notes: input.notes,
          },
          input.customerId,
        );
      }).pipe(Effect.provide(CustomerLive)),
    );
  },
);

export const removePreferredPickupTime = action(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) throw redirect("/", { status: 403, statusText: "Forbidden" });

  return await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CustomerService);
      return yield* service.removePreferredPickupDateTime(id);
    }).pipe(Effect.provide(CustomerLive)),
  );
});

export const removePreferredDeliveryTime = action(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) throw redirect("/", { status: 403, statusText: "Forbidden" });

  return await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CustomerService);
      return yield* service.removePreferredDeliveryDateTime(id);
    }).pipe(Effect.provide(CustomerLive)),
  );
});

export const addNote = action(async (input: { customerId: string; title: string; content: string }) => {
  "use server";
  const auth = await withSession();
  if (!auth) throw redirect("/", { status: 403, statusText: "Forbidden" });

  return await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CustomerService);
      return yield* service.addNote(input.title, input.content, input.customerId);
    }).pipe(Effect.provide(CustomerLive)),
  );
});

export const updateNote = action(async (input: { id: string; title: string; content: string }) => {
  "use server";
  const auth = await withSession();
  if (!auth) throw redirect("/", { status: 403, statusText: "Forbidden" });
  const user = auth[0];
  if (!user) throw redirect("/", { status: 403, statusText: "Forbidden" });
  const session = auth[1];
  if (!session) throw redirect("/", { status: 403, statusText: "Forbidden" });
  const orgId = session.current_organization_id;
  if (!orgId) throw redirect("/", { status: 403, statusText: "Forbidden" });

  return await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CustomerService);
      return yield* service.updateNote(input.id, input.title, input.content);
    }).pipe(Effect.provide(CustomerLive)),
  );
});

export const removeNote = action(async (id: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) throw redirect("/", { status: 403, statusText: "Forbidden" });
  const user = auth[0];
  if (!user) throw redirect("/", { status: 403, statusText: "Forbidden" });
  const session = auth[1];
  if (!session) throw redirect("/", { status: 403, statusText: "Forbidden" });
  const orgId = session.current_organization_id;
  if (!orgId) throw redirect("/", { status: 403, statusText: "Forbidden" });

  return await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(CustomerService);
      return yield* service.removeNote(id);
    }).pipe(Effect.provide(CustomerLive)),
  );
});

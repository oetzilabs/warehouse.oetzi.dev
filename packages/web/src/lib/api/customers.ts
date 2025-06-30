import { action, json, query, redirect } from "@solidjs/router";
import {
  CustomerCreateSchema,
  CustomerUpdateSchema,
} from "@warehouseoetzidev/core/src/drizzle/sql/schemas/customers/customers";
import { CustomerLive, CustomerService } from "@warehouseoetzidev/core/src/entities/customers";
import { Effect } from "effect";
import { InferInput } from "valibot";
import { getAuthenticatedUser } from "./auth";
import { run } from "./utils";

export const getCustomers = query(() => {
  "use server";
  return run(
    "@query/customers",
    Effect.gen(function* (_) {
      const customerService = yield* CustomerService;
      const customers = yield* customerService.findByOrganizationId();
      return customers;
    }).pipe(Effect.provide(CustomerLive)),
    json([]),
  );
}, "customers-by-organization");

export const getCustomerById = query((id: string) => {
  "use server";
  return run(
    "@query/customer-by-id",
    Effect.gen(function* (_) {
      const customerService = yield* CustomerService;
      const customer = yield* customerService.findById(id);
      if (!customer) {
        throw redirect(`/customers/${id}`, { status: 404, statusText: "Not Found" });
      }

      const orders = yield* customerService.getOrdersByCustomerId(customer.id);

      return {
        customer,
        orders,
      };
    }).pipe(Effect.provide(CustomerLive)),
    json(undefined),
  );
}, "customer-by-id");

export const createCustomer = action((data: Omit<InferInput<typeof CustomerCreateSchema>, "id">) => {
  "use server";
  return run(
    "@action/create-customer",
    Effect.gen(function* (_) {
      const service = yield* CustomerService;
      const customer = yield* service.create(data);
      return json(customer, {
        revalidate: [getAuthenticatedUser.key, getCustomers.key],
        headers: {
          Location: `/customers/${customer.id}`,
        },
        status: 303,
      });
    }).pipe(Effect.provide(CustomerLive)),
    json(undefined, {
      revalidate: [getAuthenticatedUser.key, getCustomers.key],
    }),
  );
});

export const updateCustomer = action((data: InferInput<typeof CustomerUpdateSchema>) => {
  "use server";
  return run(
    "@action/update-customer",
    Effect.gen(function* (_) {
      const service = yield* CustomerService;
      const customer = yield* service.update(data);
      return json(customer, {
        revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.keyFor(customer.id)],
      });
    }).pipe(Effect.provide(CustomerLive)),
    json(undefined, {
      revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.key],
    }),
  );
});

export const deleteCustomer = action((id: string) => {
  "use server";
  return run(
    "@action/delete-customer",
    Effect.gen(function* (_) {
      const service = yield* CustomerService;
      const customer = yield* service.safeRemove(id);
      return json(customer, {
        revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.keyFor(customer.id)],
        headers: {
          Location: `/customers/`,
        },
      });
    }).pipe(Effect.provide(CustomerLive)),
    json(undefined, {
      revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.key],
    }),
  );
});

export const addPreferredPickupTime = action(
  (input: { customerId: string; startTime: Date; endTime?: Date; notes?: string }) => {
    "use server";
    return run(
      "@action/add-preferred-pickup-time",
      Effect.gen(function* (_) {
        const service = yield* CustomerService;
        const customer = yield* service.addPreferredPickupDateTime(
          {
            startTime: input.startTime,
            endTime: input.endTime,
            notes: input.notes,
          },
          input.customerId,
        );
        return json(customer, {
          revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.keyFor(input.customerId)],
        });
      }).pipe(Effect.provide(CustomerLive)),
      json(undefined, {
        revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.keyFor(input.customerId)],
      }),
    );
  },
);

export const addPreferredDeliveryTime = action(
  (input: { customerId: string; startTime: Date; endTime?: Date; notes?: string }) => {
    "use server";
    return run(
      "@action/add-preferred-delivery-time",
      Effect.gen(function* (_) {
        const service = yield* CustomerService;
        const customer = yield* service.addPreferredDeliveryDateTime(
          {
            startTime: input.startTime,
            endTime: input.endTime,
            notes: input.notes,
          },
          input.customerId,
        );
        return json(customer, {
          revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.keyFor(input.customerId)],
        });
      }).pipe(Effect.provide(CustomerLive)),
      json(undefined, {
        revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.keyFor(input.customerId)],
      }),
    );
  },
);

export const removePreferredPickupTime = action((id: string) => {
  "use server";
  return run(
    "@action/remove-preferred-pickup-time",
    Effect.gen(function* (_) {
      const service = yield* CustomerService;
      const customer = yield* service.findById(id);
      const result = yield* service.removePreferredPickupDateTime(id);
      return json(result, {
        revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.keyFor(customer.id)],
      });
    }).pipe(Effect.provide(CustomerLive)),
    json(undefined, {
      revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.key],
    }),
  );
});

export const removePreferredDeliveryTime = action((id: string) => {
  "use server";
  return run(
    "@action/remove-preferred-delivery-time",
    Effect.gen(function* (_) {
      const service = yield* CustomerService;
      const customer = yield* service.findById(id);
      const result = yield* service.removePreferredDeliveryDateTime(id);
      return json(result, {
        revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.keyFor(customer.id)],
      });
    }).pipe(Effect.provide(CustomerLive)),
    json(undefined, {
      revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.key],
    }),
  );
});

export const addNote = action((input: { customerId: string; title: string; content: string }) => {
  "use server";
  return run(
    "@action/add-note",
    Effect.gen(function* (_) {
      const service = yield* CustomerService;
      const note = yield* service.addNote(input.title, input.content, input.customerId);
      return json(note, {
        revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.keyFor(input.customerId)],
      });
    }).pipe(Effect.provide(CustomerLive)),
    json(undefined, {
      revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.key],
    }),
  );
});

export const updateNote = action((input: { id: string; title: string; content: string }) => {
  "use server";
  return run(
    "@action/update-note",
    Effect.gen(function* (_) {
      const service = yield* CustomerService;
      const note = yield* service.updateNote(input.id, input.title, input.content);
      return json(note, {
        revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.keyFor(note.customerId)],
      });
    }).pipe(Effect.provide(CustomerLive)),
    json(undefined, {
      revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.key],
    }),
  );
});

export const removeNote = action((id: string) => {
  "use server";
  return run(
    "@action/remove-note",
    Effect.gen(function* (_) {
      const service = yield* CustomerService;
      const note = yield* service.findNoteById(id);
      const result = yield* service.removeNote(note.id);
      return json(result, {
        revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.keyFor(note.customerId)],
      });
    }).pipe(Effect.provide(CustomerLive)),
    json(undefined, {
      revalidate: [getAuthenticatedUser.key, getCustomers.key, getCustomerById.key],
    }),
  );
});

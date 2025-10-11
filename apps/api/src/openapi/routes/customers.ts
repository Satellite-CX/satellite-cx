import { createRoute } from "@hono/zod-openapi";
import {
  Customer,
  CustomerCreateInput,
  CustomerDeleteOutput,
  CustomerGetInput,
  CustomerList,
  CustomerListInput,
  CustomerUpdateInput,
  CustomerUpdateParams,
} from "@repo/validators";

const sharedConfig = {
  security: [
    {
      ApiKey: [],
    },
  ],
  tags: ["customers"],
};

export const customerListRoute = createRoute({
  ...sharedConfig,
  method: "get",
  title: "List Customers",
  summary: "List customers",
  operationId: "listCustomers",
  path: "/",
  "x-codeSamples": [
    {
      lang: "js",
      label: "JavaScript SDK",
      source: "console.log('hello world')",
    },
  ],
  request: {
    query: CustomerListInput,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CustomerList,
        },
      },
      description: "Retrieve the customers",
    },
  },
});

export const customerGetRoute = createRoute({
  ...sharedConfig,
  method: "get",
  title: "Get Customer",
  summary: "Get a customer",
  operationId: "getCustomer",
  path: "/{id}",
  request: {
    params: CustomerGetInput,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: Customer,
        },
      },
      description: "Retrieve a single customer",
    },
  },
});

export const customerCreateRoute = createRoute({
  ...sharedConfig,
  method: "post",
  title: "Create Customer",
  summary: "Create a customer",
  operationId: "createCustomer",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CustomerCreateInput,
        },
      },
      description: "Customer data to create",
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: Customer,
        },
      },
      description: "Customer created successfully",
    },
    400: {
      description: "Invalid request data",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

export const customerUpdateRoute = createRoute({
  ...sharedConfig,
  method: "put",
  title: "Update Customer",
  summary: "Update a customer",
  operationId: "updateCustomer",
  path: "/{id}",
  request: {
    params: CustomerUpdateParams,
    body: {
      content: {
        "application/json": {
          schema: CustomerUpdateInput,
        },
      },
      description: "Customer data to update",
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: Customer,
        },
      },
      description: "Customer updated successfully",
    },
    400: {
      description: "Invalid request data",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Customer not found",
    },
  },
});

export const customerDeleteRoute = createRoute({
  ...sharedConfig,
  method: "delete",
  title: "Delete Customer",
  summary: "Delete a customer",
  operationId: "deleteCustomer",
  path: "/{id}",
  request: {
    params: CustomerGetInput,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CustomerDeleteOutput,
        },
      },
      description: "Customer deleted successfully",
    },
    404: {
      description: "Customer not found",
    },
  },
});

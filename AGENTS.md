# Engineering Rules

- Keep business rules, filtering, sorting, aggregation, validation decisions, and financial calculations in backend services. Frontend components should request prepared data through APIs and only render it or collect user input.
- Do not duplicate backend calculations in client-side components. Add or extend an API endpoint when the UI needs a derived result.
- Components, pages, and hooks must not call `fetch`, Axios, or the shared `api` client directly. Define request functions in `apps/web/src/services/` and call those functions from the UI layer.
- Do not declare inline object types, intersections, or destructuring type expressions in service function arguments. Define a named `interface` or `type` for each request/response contract above the service function, then pass one named parameter object (for example, `getBudgets(params: BudgetPeriodParams)` and `updateTransaction(params: UpdateTransactionParams)`).

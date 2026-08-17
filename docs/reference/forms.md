# Forms

Every form in the app — auth screens and the opportunity sheet — runs on one TanStack Form
setup in `src/components/form/`. Domain forms own their schema and their submit handler,
nothing else.

## One hook, registered components

`form-hook.ts` calls `createFormHook` once and registers the shared parts:

- **`fieldComponents`** — `TextInputField`, `SelectField`, `TextareaField`, `RadioGroupField`,
  `PasswordField`. Reached as `field.TextInputField` inside `form.AppField`.
- **`formComponents`** — `SubmitButton`. Reached as `form.SubmitButton` inside `form.AppForm`.

Field components read their value through **`useFieldContext<T>()`**, never through a
`field: AnyFieldApi` prop. That distinction is the whole point: `AnyFieldApi` makes
`field.state.value` implicitly `any`, so a typo in a handler compiles. With the context hook,
`TextInputField` knows its value is a `string`, and `form.AppField name="…"` is checked against
the form's own shape at the call site — a misspelt field name fails to compile.

`FormField` is the one exception: it takes `useFieldContext<unknown>()` deliberately. It reads
`field.name` and `field.state.meta`, never the value, so `unknown` is the honest type. Making it
generic would add an annotation nobody reads.

## What each layer owns

`FormField` is the shell every field shares: label, the required asterisk, and **one slot under
the control** holding the error when there is one and the hint otherwise. Field components own
their control and pass it as plain `children`. A field that renders its own label is a field
that will drift.

Each field recomputes the one line that decides whether it is showing an error:

```ts
const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
```

`FormField` computes it too, for the message and for `data-invalid`. That is a deliberate
duplication, not an oversight: extracting it bought one shared line at the price of an
indirection in every file, and `FormField` took its `children` through a render prop purely to
hand the value back down. Inlining it removed both. The `id` is just `field.name`, so it never
needed passing either.

The duplication stays benign as long as **`FormField` remains the only component that renders
the error**. A field copying `isInvalid` for its own `aria-invalid` is cosmetic; a field
rendering its own `<FieldError>` is how the auth screens and the sheet drifted apart before
they shared a form hook.

`RadioGroupField` keeps a render prop, for an unrelated reason: its control is not a native
input, so it needs the wiring passed to it rather than rendered for it.

The type scale splits by role, not by screen: the **label** is 14px sentence case (the `Label`
default), while the asterisk, hints and the notes counter stay at `text-2xs` (11px). Errors
keep the `FieldError` default of 14px — they share the hint's slot but outrank it. Sheet
section titles (`SheetFormSection`) keep 11px uppercase; they are headings, not labels.

`labelSuffix` puts an **action** beside the label — the "forgot password?" link. Live state does
not go there; it belongs in `hint`, under the control with everything else. That prop previously
carried both, which is how the notes counter ended up as the only help text above its control.

## Errors and submit

One sequence, on every form in the app:

1. **First paint** — the button is clickable and no error is shown.
2. **Click on an incomplete form** — the button disables and the errors appear, including on
   fields the user never reached.
3. **Fields filled** — the button re-enables.

Two rules produce it, and both are one-liners. An error shows once the field is **touched**
(`isTouched && !isValid`); `SubmitButton` disables on `!canSubmit`.

Neither step needs a `submissionAttempts` check, because TanStack Form already covers both ends:

- **Step 1** holds because `canSubmit` starts `true` and stays there until the form is
  interacted with — even when the default values are invalid, as on the opportunity sheet where
  recruiter starts empty.
- **Step 2** works because `handleSubmit` marks **every** field as touched before it validates,
  so a blocked submission reveals the errors on fields the user never reached.

`SubmitButton` takes an optional `busy` for a _concurrent_ reason to block (an in-flight Google
OAuth call), kept separate from the form's own validity, and an optional `form` id for when the
button sits outside its `<form>` element.

## Sizes

Controls come in two treatments. Auth screens use the roomier 44px default; the opportunity
sheet passes `size="form"` for a denser 35px filled control, because a panel with fifteen fields
does not want what a four-field login wants. Same components, one prop.

## Splitting a large form

Sections built with **`withForm`** take the form through the HOC rather than as a prop, which
keeps `form.AppField` type-checked inside each section file without a hand-written
`ReturnType<…>` alias. `withForm` reads its `defaultValues` for type-checking only — never at
runtime — so a derived constant is enough. See `docs/reference/opportunity-form.md`.

Define the `render` function as a **named** function, not an arrow: the React hooks ESLint rule
otherwise misreads it and reports false positives.

## Loading buttons

`loading` on `Button` swaps the label for a spinner. The naive version — rendering the spinner
alone — collapses the button to the spinner's width, then snaps back when the request settles.
The auth screens hide this: their submit is stretched by a flex parent, so its width never
depended on its content. Auto-sized buttons (dialog footers, the opportunity sheet) do jump.

So the label stays mounted, hidden with `invisible` — `visibility: hidden` keeps the box in the
layout, unlike `display: none` — and the spinner is stacked over it in the same grid cell. The
button keeps its idle width, and centring falls out of `place-items-center` rather than an
absolute overlay that would depend on the `relative` buried in `buttonVariants`.

The label wrapper is a real box, so the button's own `gap` no longer reaches the icon and text
inside it — they would sit flush while loading. `gap-[inherit]` is the obvious fix and does not
work: Tailwind emits no rule for it, and the computed value stays `normal`. Each `size` variant
therefore restates its gap for `[data-slot=button-label]`, keeping one source of truth in
`buttonVariants` — a new size needs that second declaration alongside its own `gap-*`.

Accessibility: the hidden label is **not** `aria-hidden`, so the button keeps its accessible
name while busy; `aria-busy` marks the pending state and `disabled` blocks double submits. The
spinner is decorative (`aria-hidden`, no `role="status"`) — a live region here would fight the
button's own name and hardcode an English string into a French UI.

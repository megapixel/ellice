# LoanDesk CRM — clickable prototype

A UI-only prototype of a CRM for a loan broker managing corporate clients and their
business loans. **Everything is mock data.** There is no backend, no database, no
authentication, and no AI or API calls — every "AI" output is a hardcoded placeholder
that exists only to demonstrate the flow.

The point of this build is to validate navigation, layout and information hierarchy.

## Sections

| Route | Screen |
|---|---|
| `#/` | Dashboard — stat tiles, three charts, maturities at 30/60/90 days, occasions, recent approvals, Insights |
| `#/clients` | Client list (search + status filter) |
| `#/clients/:id` | Client detail — company info, directors, loans table |
| `#/loans` | Loan list (search + status/type filters) |
| `#/loans/:id` | Loan detail — full terms, repayment progress, link to parent client |
| `#/occasions` | Director birthdays + incorporation anniversaries, next 90 days |
| `#/lookup` | Instant Lookup — simulated Telegram bot for pulling client data by text |

## Dashboard visuals

Above the lists the dashboard leads with four stat tiles (portfolio outstanding,
maturing in 90 days, approved this month, occasions in 30 days) and three charts,
all built in plain HTML/CSS in `js/charts.js` — no chart library:

- **Maturity runway** — columns of outstanding balance falling due per 30-day window.
- **Exposure by lender** — horizontal bars, largest first.
- **Book by status** — one stacked bar of approved amount by facility status, with a
  labelled legend carrying the values.

Colour follows a deliberate rule set: magnitude charts use a **single blue hue**
(never a ramp keyed to bar length), the stacked bar is the only place colour carries
meaning and it uses reserved status colours **always beside a label**, and text never
wears a data colour. Marks are ≤24px with 4px rounded data-ends, gridlines are solid
hairlines, stacked segments are separated by a 2px surface gap, and every mark has a
hover tooltip. Dark mode uses separately chosen steps validated against the dark
surface rather than an automatic flip.

## Instant Lookup (Telegram simulator)

`#/lookup` mocks the broker texting a bot from their phone to pull a client's position
out in seconds — no laptop, no login. It's a chat UI with quick-command chips, a typing
indicator and deep links back into the CRM.

| Command | Returns |
|---|---|
| `/loan <company>` | every facility for that client — lender, amounts, rate, status, maturity |
| `/client <company>` | company profile, contact details and directors with birthdays |
| `/maturing [days]` | facilities maturing in the next N days (default 30) + total outstanding |
| `/birthdays` | birthdays and anniversaries in the next 30 days |
| `/help` | the command list |

Plain phrasing works too — `loan info of ABC Logistics`, `loans for Greenfield`, or just
`Apex`. Company matching is loose (ignores case, punctuation and "Pte Ltd"), and UEN works
as a lookup key.

Nothing is sent to Telegram and no model is involved: replies are read straight from the
same mock arrays as the rest of the app, so they always agree with what's on the other
screens. A real build would run a bot webhook against the same data, with the broker's
chat ID bound to their CRM account.

## Add / edit records

Clients and loans can be created and edited from the UI:

- **Clients** — `+ Add Client` on the list, `Edit` on each list row, and `Edit Client`
  on the detail page. The form covers company fields plus a repeatable **directors**
  editor (add/remove rows, each with name, role, birthday, phone, email), so new
  birthdays flow straight into the Dashboard and Special Occasions screens.
- **Loans** — `+ Add Loan` on the list, `Edit` on each list row, `Edit Loan` on the
  detail page, and `+ Add Loan` inside a client's loans section (pre-selects that client).
  Basic validation: lender, amount and maturity date are required; outstanding cannot
  exceed the amount approved; maturity must fall after disbursement.

Saves write to the **in-memory mock arrays only** — nothing is persisted, so a page
reload restores the original sample data. New records get the next id in sequence
(`c8`, `l15`, …) and the app navigates to the new record's detail page.

The header search box ("Ask about a client...") returns one canned example answer —
it demonstrates a future natural-language query feature and has no logic behind it.

"Generate Message" / "Generate Wish" open a mock AI-drafted message prefilled with
that record's data. The composer lets you:

- switch channel between **Email** (with an editable subject line) and **WhatsApp**
  (shorter, chattier wording, addressed to the mobile number);
- switch tone between **Friendly / Formal / Short**;
- **edit the draft freely** before sending — edits are kept per channel+tone, so
  switching back and forth doesn't discard them, and **Reset draft** restores the
  generated text.

**Send**, **Copy** and **Open in WhatsApp / email client** are non-functional —
they just raise a toast. Nothing is sent anywhere.

## Running locally

The app uses ES modules, which browsers refuse to load over `file://`. Serve it:

```bash
cd ellice
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying to GitHub Pages

No build step — push the repo and enable Pages.

1. `git init && git add . && git commit -m "Loan broker CRM prototype"`
2. Push to a GitHub repository.
3. **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.

Routing is hash-based (`#/clients/c2`), so deep links work on Pages with no
redirect or 404 rules. All asset paths are relative, so it also works from a
project subpath such as `username.github.io/repo/`.

## Structure

```
index.html          shell: sidebar, header search, view outlet, modal root
css/app.css         design tokens, layout, tables, modal; light + dark
js/app.js           boot: routes, nav sync, header search
js/router.js        hash router (:param matching)
js/data.js          mock companies, directors, loans + derived helpers
js/format.js        currency / date / badge helpers
js/modal.js         mock message composer + toast
js/forms.js         add / edit forms for clients and loans
js/charts.js        dashboard chart builders + hover tooltip
js/pages/*.js       one module per screen (dashboard, clients, loans, occasions, telegram)
```

Mock dates are generated as offsets from *today* at load time, so the 30/60/90-day
windows and upcoming-occasion lists always look populated whenever the prototype is opened.

## Sample data

7 companies (13 directors) and 14 loans across DBS, OCBC, UOB, Maybank,
Funding Societies and Validus, covering working capital, term loans, trade finance,
equipment financing and property loans, in Active / Approved / Pending / Matured /
Rejected states.

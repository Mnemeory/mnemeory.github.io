### Mob Radio Playlist

- Run `npm install` once to set up the workspace.
- Generate the shuffled playlist manifest with `npm run generate:mobradio`. The script scans `assets/mobradio/` for `.mp3` files, normalizes their titles, and writes `assets/mobradio/playlist.json`.
- The Mob Radio button reads the manifest at runtime and shows a tooltip with the active track title. If the manifest is missing, the control disables itself instead of failing silently.
- A GitHub Actions workflow (`.github/workflows/mobradio.yml`) runs the generator on every push and pull request. Commits that forget to update the manifest will fail CI.

### Ledger data (YAML authoring → single JSON at runtime)

- Author ledger data in YAML under `data/`:
  - `data/collections.yml`
  - `data/territory.yml`
  - `data/vendetta.yml`
  - `data/familyroster.yml`
- Build the consolidated runtime file with:

```bash
npm run build:ledger
```

This generates `assets/data/ledger.json` which the app fetches once and shares with the roster iframe.

- A GitHub Actions workflow (`.github/workflows/build-ledger.yml`) regenerates and commits `assets/data/ledger.json` on push when YAML changes.

#### Collections (`data/collections.yml`)
```yaml
- name: "Business Name"
  location: "District"
  nightly: "$150"  # Can also be percentage like "10%"
  status: "current"  # current, inactive, late, terminated, refusing
  made_by: "Family Member Name"
  start_date: "Nov. 5, 2015"
  contact: "Contact Name (Title)"
  notes: "Additional information"
```

#### Territory (`data/territory.yml`)
```yaml
- name: "District Name"
  status: "Controlled"  # Controlled, Uncontrolled, Contested, Neutral, Expanding
  assigned_crew:
    capo: [Capo Names]
    la_squadra: [Soldato Names]
    la_famiglia: [Associate Names]
  businesses: [Business1, Business2]
  notes: "Territory details"
```

#### Vendetta (`data/vendetta.yml`)
```yaml
- name: "Target Name"
  nickname: "The Alias"
  offense: "Description of transgression"
  type: "blood"  # blood or financial
  last_seen: "Location details"
  associates: "Known connections"
  authorized_by: "Authorizing Family Member"
  status: "active"  # active, resolved, pending, on_hold
```

#### Family Roster (`data/familyroster.yml`)
```yaml
boss:
  - name: "Boss Name"
    status: "active"  # active, vacant, deceased, retired

boss_consigliere:
  - name: "Consigliere Name"
    status: "active"

capo:
  - name: "Capo Name"
    clan: "Giovanni"
    status: "active"

consigliere:
  - name: "Consigliere Name"
    assigned_capo: "Capo Name"
    clan: "Giovanni"

soldato:
  - name: "Soldato Name"
    assigned_capo: "Capo Name"
    clan: "Giovanni"
    status: "active"

associate:
  - name: "Associate Name"
    assigned_soldato: "Soldato Name"  # or assigned_consigliere
    clan: "Clan Name"
    status: "active"
```

Key settings are in `assets/js/app.js` and `assets/js/org-chart.js`.
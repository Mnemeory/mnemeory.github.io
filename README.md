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

Key settings in `assets/js/config.js`:
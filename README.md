## Pencode Tags

### Dynamic Content Tags
- `[officername]` - Automatically replaced with authenticated officer name ((NOT IN GAME PENCODE, UNIQUE TO SYSTEM))
- `[roundid]` - Automatically replaced with current round/shift ID ((NOT IN GAME PENCODE, UNIQUE TO SYSTEM))
- `[field]` - User-input field
- `[charges]` - Creates clickable charge field ((NOT IN GAME PENCODE, UNIQUE TO SYSTEM))
- `[time]` - Current system time
- `[date]` - Current system date

### Text Formatting
- `[b]text[/b]` - **Bold text**
- `[i]text[/i]` - *Italic text*
- `[u]text[/u]` - <u>Underlined text</u>
- `[large]text[/large]` - Large text
- `[small]text[/small]` - Small text

### Structure & Layout
- `[h1]text[/h1]` - Header 1
- `[h2]text[/h2]` - Header 2
- `[h3]text[/h3]` - Header 3
- `[br]` - Line break
- `[hr]` - Horizontal rule
- `[center]text[/center]` - Centered text

### Lists & Tables
- `[list]` and `[/list]` - Unordered list
- `[*]` - List item
- `[table]` and `[/table]` - Table with borders
- `[grid]` and `[/grid]` - Table without borders
- `[row]` - Table row
- `[cell]` - Table cell

### Corporate Branding
- `[logo_scc]` - ⬢ SCC
- `[logo_nt]` - ◆ NT
- `[logo_zh]` - ▣ ZH
- `[logo_idris]` - ◉ IDRIS
- `[logo_eridani]` - ⬟ ECF
- `[logo_zavod]` - ▲ ZAVOD
- `[logo_hp]` - ⬡ HEPH
- `[logo_be]` - ◈ BE
- `[logo_golden]` - ◊ GOLDEN
- `[logo_pvpolice]` - ★ PKM

### Special Elements
- `[barcode]` - Barcode pattern
- `[sign]` - Signature placeholder
- `[redacted]text[/redacted]` - Redacted text (shown as blocks)
- `[color=color]text[/color]` - Colored text
- `[lang=language]text[/lang]` - Language blocks for roleplay

## Usage

1. **Authentication**: Enter officer name and round ID on startup
2. **Select Template**: Choose available template
3. **Fill Fields**: Complete required fields in the left panel
4. **Preview**: View the formatted document in the center panel
5. **Edit**: Make manual edits in the terminal output panel
6. **Export**: Copy to clipboard or download as text file

## Keyboard Shortcuts

- `Ctrl+S` - Download document
- `Ctrl+C` - Copy to clipboard (when no text selected)
- `Ctrl+Shift+C` - Clear all fields

## Template Development

Templates are stored in the `templates/` directory as `.txt` files with the following format:

```
Name: Template Name
Desc: Brief description of the template

[Template content with pencode tags]
```

---
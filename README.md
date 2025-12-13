# THE VOID (ARDRA)

Upload this folder to GitHub, then deploy on Vercel.

## Required Environment Variables (in Vercel → Settings → Environment Variables)

### Email Gate (pick ONE provider)

**Buttondown (recommended)**
- EMAIL_PROVIDER = BUTTONDOWN
- BUTTONDOWN_API_KEY = (your Buttondown API key)

**ConvertKit**
- EMAIL_PROVIDER = CONVERTKIT
- CONVERTKIT_API_KEY = ...
- CONVERTKIT_FORM_ID = ...

### Nominatim (geocoding)
- NOMINATIM_USER_AGENT = void.calendar (or your email)

## Calendar feed URL pattern
/api/panchang.ics?city=Berlin&country=Germany&year=2026

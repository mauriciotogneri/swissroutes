### [b/validation-and-coercion/gpx-export/unescaped-xml-name] GPX export does not escape the route title

**Location:** `public/script.js:1852-1861` (`gpxData`).

**Severity:** Low

**Confidence:** Medium

**Likelihood:** Low. None of the 786 committed route titles contains `&`, `<` or `>`, so it needs a future title that does.

**Defect:** `${r_number} - ${title}` goes straight into both `<name>` elements. A title containing `&` or `<` produces a GPX file that is not well-formed XML, which importers will reject. The only processing in `bin/helpers.js` is `trim()`.

**Trigger:** Download the GPX of a route whose title contains `&`, for example "Rhein & Rhône".

**Evidence / verification:** Reproduced with `gpxData` extracted from `script.js` in a disposable copy. For title "Rhein & Rhône", `xmllint --noout` reported `xmlParseEntityRef: no name` on both `<name>` lines (exit 1). The data scan found 0 of 786 titles with those characters, hence Medium confidence.

**Suggested fix:** Escape `&`, `<` and `>` in the name before writing it into the XML.

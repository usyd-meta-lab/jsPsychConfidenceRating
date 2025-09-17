# confidence-rating (jsPsych v8+ plugin)

A segmented confidence scale for jsPsych.  
- **Discrete ticks (including endpoints)** with the thumb snapping **on** each tick.  
- **Thumb hidden** until the first click/tap.  
- **Dynamic point counts**: any integer `n_points ≥ 2`.  
- **Optional per-tick anchors**: supply `tick_labels` (length = `n_points`) to label **every tick**; otherwise a simple left/right anchor pair is shown.  
- Uses browser **default fonts** (no custom text styling applied by the plugin).

---


## Parameters

| Parameter | Type | Default | Description |
|---|---|---:|---|
| `prompt` | `STRING (HTML allowed)` | `"Rate your confidence:"` | Text shown above the scale. You can include HTML to style content (e.g., bold, font tags). |
| `n_points` | `INT` | `6` | Number of discrete, **selectable** points (≥ 2). Points include both endpoints. |
| `tick_labels` | `ARRAY<STRING (HTML allowed)>` | `undefined` | Optional labels for **each tick** (length should be `n_points`). If provided, these appear under each tick and **override** `left_label`/`right_label`. |
| `left_label` | `STRING (HTML allowed)` | `"Guessing"` | Left anchor (only used when `tick_labels` is **not** provided). |
| `right_label` | `STRING (HTML allowed)` | `"Certain"` | Right anchor (only used when `tick_labels` is **not** provided). |
| `require_response` | `BOOL` | `true` | If `true`, the **Submit** button is disabled until the first selection. |
| `button_label` | `STRING` | `"Submit"` | Submit button text. |
| `width_px` | `INT` | `980` | Max content width of the scale “card”. |
| `track_height_px` | `INT` | `34` | Height of the slider track. |
| `block_bg` | `STRING (CSS color)` | `#A3A3A3` | Background color of the trial block (full viewport). |

**Behavioral details**

- Ticks are placed at equal intervals from **0%** (left rounded end) to **100%** (right rounded end).
- The thumb is positioned at proportion `(value − 1) / (n_points − 1)`.
- Dividers are drawn **between** endpoints; the knob can land on endpoints and interior ticks.

---

## Data Generated

Each trial records the following fields:

| Field | Type | Description |
|---|---|---|
| `response` | `INT` | Selected tick index in `1..n_points` (1 = left endpoint, `n_points` = right endpoint). |
| `rt` | `INT` | Response time in milliseconds from trial onset to click of the **Submit** button. |
| `n_points` | `INT` | The number of points shown on the scale. |

> If you need labels in your data, include them in the trial definition and map `response` to `tick_labels[response-1]` during analysis.

---

## Examples

### 1) Simple left/right anchors (no per-tick labels)

```js
{
  type: jsPsychConfidenceRating,
  prompt: "Rate your confidence:",
  n_points: 6,
  left_label: "Guessing",
  right_label: "Certain",
  require_response: true,
  button_label: "Submit"
}
```

### 2) Per-tick labels (e.g., percentages)

```js
{
  type: jsPsychConfidenceRating,
  prompt: "<strong>Confidence</strong>",
  n_points: 6,
  tick_labels: ["0%", "20%", "40%", "60%", "80%", "100%"],
  require_response: true
}
```

### 3) Custom look (size & background)

```js
{
  type: jsPsychConfidenceRating,
  prompt: "How sure are you?",
  n_points: 7,
  tick_labels: ["0", "1", "2", "3", "4", "5", "6"],
  width_px: 900,
  track_height_px: 28,
  block_bg: "#EEE"
}
```

---

## Keyboard, Pointer & Accessibility

- **Pointer**: first click/tap reveals the thumb and snaps to the nearest tick.
- **Drag**: after the first click, you can drag while holding down the pointer.
- **Keyboard**: after the first click, `ArrowLeft`/`ArrowRight` move the thumb one tick.
- **Focus**: the invisible range input spans the track; screen readers can interact via the input and the **Submit** button.

> You can enrich accessibility by adding more descriptive text in `prompt` or using `tick_labels` with meaningful anchors.

---

## Styling & CSS

The plugin injects minimal CSS scoped via class names. It **does not** set fonts or font sizes, so the page’s default font is used.

Key classes (to override in your global stylesheet if desired):

- `.jspsych-confwrap` — full-viewport container (background color).
- `.jspsych-confcard` — centered card (max width).
- `.jspsych-conftitle` — the prompt container.
- `.jspsych-confscale` — wrapper for the track/thumb.
- `.jspsych-conftrack` — the visible track.
- `.jspsych-confdiv` — vertical divider lines between ticks.
- `.jspsych-confthumb` — the circular knob.
- `.jspsych-conflabels` — left/right anchors (if `tick_labels` not used).
- `.jspsych-conf-ticklabels` — wrapper for per-tick labels (if used).
- `.jspsych-conf-tlabel` — individual tick label (positioned absolutely).

Example override:

```css
/* Make the track taller and the knob larger globally */
.jspsych-conftrack { height: 44px !important; }
.jspsych-confthumb { width: 36px !important; height: 36px !important; }
```

---

## Simulation

The plugin implements jsPsych v8 simulation hooks.

- **Data-only**: generates a random `response ∈ [1..n_points]` and a plausible `rt`.
- **Visual**: renders the trial, clicks the track at the tick corresponding to `response`, then clicks **Submit**.

```js
// Example: programmatic test
jsPsych.simulate([{
  type: jsPsychConfidenceRating,
  n_points: 6
}], "visual");
```

---

## Notes & Gotchas

- **tick_labels length**: if provided and shorter than `n_points`, missing entries render as blank labels; if longer, they are truncated.
- **Endpoints selectable**: by design, both rounded ends are selectable and aligned to ticks.
- **Precision/antialiasing**: at certain zoom levels, 1px rounding can make divider lines look slightly offset. You can tweak the divider `top/bottom` vs. the track `::after` inset in CSS if you need pixel-perfect visuals in screenshots.

---

## Repository

Source and issues: [usyd-meta-lab/jsPsychConfidenceRating](https://github.com/usyd-meta-lab/jsPsychConfidenceRating)

---

## Changelog

- **1.0.0**: Initial public version for jsPsych v8+  
  - Discrete ticks with endpoint selection  
  - Hidden thumb until first interaction  
  - Per-tick label support via `tick_labels`  
  - Default-font styling (no font families/sizes in CSS)

---

## License

MIT (same spirit as jsPsych). Include attribution where practical.

---

## Citation

If you use this plugin in published work, please cite jsPsych:

> de Leeuw, J. R., Gilbert, R. A., & Luchterhandt, B. (2023). jsPsych: Enabling an Open-Source Collaborative Ecosystem of Behavioral Experiments. *Journal of Open Source Software, 8*(85), 5351. https://doi.org/10.21105/joss.05351

…and (optionally) link to your repository containing this plugin.

var jsPsychConfidenceRating = (function (jspsych) {
  'use strict';

  var version = "1.0.0";

  const info = {
    name: "confidence-rating",
    version,
    parameters: {
      /** Title above scale */
      prompt: { type: jspsych.ParameterType.STRING, default: "Rate your confidence:" },
      /** Left/right anchors below the scale */
      left_label: { type: jspsych.ParameterType.STRING, default: "Guessing" },
      right_label: { type: jspsych.ParameterType.STRING, default: "Certain" },
      /** Optional labels for each tick (length should be n_points). If provided, these will be shown under every tick and override left/right labels. */
      tick_labels: { type: jspsych.ParameterType.HTML_STRING, array: true, default: undefined },
      /** Number of discrete points (>=2) */
      n_points: { type: jspsych.ParameterType.INT, default: 6 },
      /** Disable submit until first selection */
      require_response: { type: jspsych.ParameterType.BOOL, default: true },
      /** Submit button text */
      button_label: { type: jspsych.ParameterType.STRING, default: "Submit" },
      /** Visual tuning */
      width_px: { type: jspsych.ParameterType.INT, default: 980 },
      track_height_px: { type: jspsych.ParameterType.INT, default: 34 },
      block_bg: { type: jspsych.ParameterType.STRING, default: "#A3A3A3" }
    },
    data: {
      /** Selected point (1..n_points) */
      response: { type: jspsych.ParameterType.INT },
      /** Reaction time in ms */
      rt: { type: jspsych.ParameterType.INT },
      /** Number of points shown (for bookkeeping) */
      n_points: { type: jspsych.ParameterType.INT }
    },
    // optional citations block omitted for brevity
  };

  class ConfidenceRatingPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    static { this.info = info; }

    trial(display_element, trial) {
      const n = Math.max(2, trial.n_points | 0);
      const startTime = performance.now();

      // ----- Styles (scoped by being injected for this trial node) -----
      let css = "";
      css += ".jspsych-confwrap{background:"+trial.block_bg+";min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center}";
      css += ".jspsych-confcard{width:"+trial.width_px+"px;max-width:92vw;text-align:center}";
      css += ".jspsych-conftitle{margin-bottom:28px}";
      css += ".jspsych-confscale{position:relative;margin:0 auto 14px auto}";
      css += ".jspsych-conftrack{position:relative;height:"+trial.track_height_px+"px;border:2px solid #111;border-radius:"+Math.ceil(trial.track_height_px/2)+"px;background:#d9d9d9}";
      css += ".jspsych-conftrack::after{content:'';position:absolute;inset:3px;border-radius:"+ (Math.ceil(trial.track_height_px/2)-3) +"px;background:#e7e7e7}";
      css += ".jspsych-confdiv{position:absolute;top:2px;bottom:2px;width:2px;background:#111;opacity:.8;z-index:2}";
      css += ".jspsych-confthumb{position:absolute;top:50%;transform:translate(-50%,-50%);width:"+ (trial.track_height_px-10) +"px;height:"+ (trial.track_height_px-10) +"px;border-radius:999px;border:2px solid #111;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);display:none;z-index:3}";
      css += ".jspsych-conflabels{display:flex;justify-content:space-between;margin-top:8px}";
      css += ".jspsych-confbtn{margin:36px auto 0;padding:10px 18px;border-radius:12px;background:#fff;border:2px solid #111;cursor:pointer}";
      css += ".jspsych-confbtn:disabled{opacity:.55;cursor:not-allowed}";
      css += ".jspsych-confinput{position:absolute;inset:0;opacity:0;z-index:4;cursor:pointer}";
      css += ".jspsych-conf-ticklabels{position:relative;margin-top:8px;height:1.5em}";
      css += ".jspsych-conf-tlabel{position:absolute;top:0;transform:translateX(-50%);white-space:nowrap}";
      display_element.innerHTML = `
        <style id="jspsych-confidence-css">${css}</style>
        <div class="jspsych-confwrap">
          <div class="jspsych-confcard">
            <div class="jspsych-conftitle">${trial.prompt}</div>
            <div class="jspsych-confscale">
              <div class="jspsych-conftrack" id="conf-track"></div>
              <div class="jspsych-confthumb" id="conf-thumb" role="img" aria-label="selected point"></div>
              <input id="conf-input" class="jspsych-confinput" type="range" min="1" max="${n}" step="1" value="1" />
            </div>
            <div class="jspsych-conflabels">
              <div>${trial.left_label}</div>
              <div>${trial.right_label}</div>
            </div>
            <button id="conf-btn" class="jspsych-confbtn" ${trial.require_response ? "disabled" : ""}>${trial.button_label}</button>
          </div>
        </div>
      `;

      // ----- Element refs -----
      const track = display_element.querySelector("#conf-track");
      const thumb = display_element.querySelector("#conf-thumb");
      const input = display_element.querySelector("#conf-input");
      const btn   = display_element.querySelector("#conf-btn");

      thumb.setAttribute('aria-hidden', 'true');

      // Per-tick labels: if provided, render labels under each tick and remove the left/right pair
      if (Array.isArray(trial.tick_labels) && trial.tick_labels.length) {
        const scaleEl = display_element.querySelector('.jspsych-confscale');
        const duo = display_element.querySelector('.jspsych-conflabels');
        if (duo) duo.remove();
        const ticksWrap = document.createElement('div');
        ticksWrap.className = 'jspsych-conf-ticklabels';
        // ensure we have exactly n labels (pad with empty strings)
        const labels = trial.tick_labels.slice(0, n);
        while (labels.length < n) labels.push('');
        for (let i = 0; i < n; i++) {
          const span = document.createElement('span');
          span.className = 'jspsych-conf-tlabel';
          span.style.left = `${(i * 100) / (n - 1)}%`;
          span.innerHTML = labels[i];
          ticksWrap.appendChild(span);
        }
        scaleEl.insertAdjacentElement('afterend', ticksWrap);
      }

      // Dividers
      for (let i = 1; i < n - 1; i++) {
        const d = document.createElement("div");
        d.className = "jspsych-confdiv";
        d.style.left = `${(i * 100) / (n - 1)}%`;
        track.appendChild(d);
      }

      // Helpers
      const positionThumb = (val) => {
        const pct = (val - 1) / (n - 1); // ticks include endpoints (1..n)
        thumb.style.left = `${pct * 100}%`;
      };
      const valueFromPointer = (event, el, nPts) => {
        const rect = el.getBoundingClientRect();
        const clientX = (event.clientX != null) ? event.clientX : (event.touches?.[0]?.clientX ?? 0);
        const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
        const p = x / rect.width;
        return Math.min(nPts, Math.max(1, Math.round(1 + p * (nPts - 1))));
      };

      positionThumb(1);
      let responded = false;

      if (Number.isInteger(trial.start_value) && trial.start_value >= 1 && trial.start_value <= n) {
        console.info('[confidence-rating] Applying start_value:', trial.start_value, 'of', n);
        input.value = String(trial.start_value);
        // Defer positioning until after layout to avoid rare misplacement on first paint
        Promise.resolve().then(() => {
          positionThumb(trial.start_value);
          thumb.style.display = 'block';
          thumb.setAttribute('aria-hidden', 'false');
        });
        responded = true;
        if (trial.require_response) btn.disabled = false;
      } else {
        if (trial.start_value != null) {
          console.warn('[confidence-rating] Ignoring invalid start_value:', trial.start_value, 'valid range is 1..'+n);
        } else {
          console.debug('[confidence-rating] No start_value provided; thumb will start hidden.');
        }
      }

      const firstSelect = (e) => {
        const v = valueFromPointer(e, track, n);
        input.value = String(v);
        positionThumb(v);
        if (!responded) {
          responded = true;
          thumb.style.display = 'block';
          thumb.setAttribute('aria-hidden', 'false');
          if (trial.require_response) btn.disabled = false;
        }
      };

      // Pointer interactions
      track.addEventListener("pointerdown", firstSelect);
      input.addEventListener("pointerdown", firstSelect);
      track.addEventListener("pointermove", (e) => {
        if (!responded || e.buttons !== 1) return;
        const v = valueFromPointer(e, track, n);
        input.value = String(v);
        positionThumb(v);
      });

      // Keyboard fine-tuning after first selection
      input.addEventListener("keydown", (e) => {
        if (!responded) return;
        if (e.key === "ArrowLeft") {
          const v = Math.max(1, parseInt(input.value, 10) - 1);
          input.value = String(v); positionThumb(v);
        } else if (e.key === "ArrowRight") {
          const v = Math.min(n, parseInt(input.value, 10) + 1);
          input.value = String(v); positionThumb(v);
        }
      });

      // Submit
      btn.addEventListener("click", () => {
        const rt = Math.round(performance.now() - startTime);
        const val = parseInt(input.value, 10);
        const trial_data = { rt: rt, response: val, n_points: n };
        this.jsPsych.finishTrial(trial_data);
      });

      if (!trial.require_response) btn.disabled = false;
    }

    /* ---------------- Simulation helpers (jsPsych 8 pattern) --------------- */
    simulate(trial, simulation_mode, simulation_options, load_callback) {
      if (simulation_mode == "data-only") {
        load_callback();
        this.simulate_data_only(trial, simulation_options);
      }
      if (simulation_mode == "visual") {
        this.simulate_visual(trial, simulation_options, load_callback);
      }
    }

    create_simulation_data(trial, simulation_options) {
      const n = Math.max(2, trial.n_points | 0);
      const default_data = {
        response: this.jsPsych.randomization.randomInt(1, n),
        rt: Math.round(1000 + this.jsPsych.randomization.sampleExGaussian(1500, 400, 1/200, true)),
        n_points: n
      };
      const data = this.jsPsych.pluginAPI.mergeSimulationData(default_data, simulation_options);
      this.jsPsych.pluginAPI.ensureSimulationDataConsistency(trial, data);
      return data;
    }

    simulate_data_only(trial, simulation_options) {
      const data = this.create_simulation_data(trial, simulation_options);
      this.jsPsych.finishTrial(data);
    }

    simulate_visual(trial, simulation_options, load_callback) {
      const data = this.create_simulation_data(trial, simulation_options);
      const display_element = this.jsPsych.getDisplayElement();
      this.trial(display_element, trial);
      load_callback();

      // Click at the appropriate proportion of the track to select `response`
      const track = display_element.querySelector("#conf-track");
      const btn   = display_element.querySelector("#conf-btn");

      const proportion = (data.response - 1) / (data.n_points - 1);
      const rect = track.getBoundingClientRect();
      const x = rect.left + proportion * rect.width;
      const y = rect.top + rect.height / 2;

      this.jsPsych.pluginAPI.pointerDown(track, { clientX: x, clientY: y }, 300);
      this.jsPsych.pluginAPI.clickTarget(btn, data.rt);
    }
  }

  return ConfidenceRatingPlugin;

})(jsPsychModule);

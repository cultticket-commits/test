// ==UserScript==
// @name         GKTools Auto POST
// @namespace    https://gktools.ris.moe/
// @version      1.0
// @description  学マス simulator 自動POST送信
// @match        https://gktools.ris.moe/simulator*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  let e = document.getElementById("gktools-notify-box");
  if (!e) {
    e = document.createElement("div");
    e.id = "gktools-notify-box";
    Object.assign(e.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: "9999",
      background: "rgba(0,0,0,0.8)",
      color: "#fff",
      padding: "10px 16px",
      borderRadius: "8px",
      fontSize: "14px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      fontFamily: "sans-serif"
    });
    e.innerHTML = `
      <label style="cursor:pointer;">
        <input type="checkbox" id="gktools-toggle" style="margin-right:6px;">
        自動POST
      </label>
      <div id="gktools-msg">監視開始</div>
    `;
    document.body.appendChild(e);
  }

  function t(msg) {
    document.getElementById("gktools-msg").textContent = msg;
  }

  function isLoggedOut() {
    const buttons = document.querySelectorAll("button.Button_button__OFOdO");
    const loginLabels = ["Discordでログイン", "Sign in with Discord", "Discord로 로그인", "Discord 登入"];
    return Array.from(buttons).some(b => loginLabels.includes(b.textContent.trim()));
  }

  function getRunButtonByIndex(i) {
    const buttons = document.querySelectorAll("button.Button_button__OFOdO");
    return buttons.length > i ? buttons[i] : null;
  }

  function showStatus(msg, isError = false) {
    let box = document.getElementById("gktools-status-box");
    if (!box) {
      box = document.createElement("div");
      box.id = "gktools-status-box";
      Object.assign(box.style, {
        position: "fixed",
        bottom: "10px",
        right: "10px",
        zIndex: "9999",
        padding: "10px 14px",
        backgroundColor: isError ? "#f44336" : "#4caf50",
        color: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        fontSize: "14px"
      });
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.style.backgroundColor = isError ? "#f44336" : "#4caf50";
    setTimeout(() => box.remove(), 5000);
  }

  function sendResult() {
    const toggle = document.getElementById("gktools-toggle");
    if (!toggle || !toggle.checked) {
      t("⏸ 自動POST OFF");
      return;
    }

    try {
      const data = Array.from(document.querySelectorAll("table.SimulatorResult_stats__nyeMw tbody td"))
        .map(td => td.innerText);

      if (data.length === 0) {
        showStatus("❌ スコア取得失敗", true);
        return;
      }

      const stageElem = document.querySelector("div.StageSelect_namePlan__ylIXg");
      const stageText = stageElem ? stageElem.innerText.trim() : "";
      const match = stageText.match(/シーズン(\d+)\s*ステージ(\d+)/);
      const stage = match ? `${match[1]}-${match[2]}` : "Unknown";

      const url = location.href;
      const note = "";
      const metaImg = document.querySelector('meta[property="og:image"]');
      const image = metaImg ? metaImg.content : "";

      const params = new URLSearchParams();
      data.forEach((v, i) => params.append(`value${i + 1}`, v));
      params.append("stage", stage);
      params.append("url", url);
      params.append("note", note);
      params.append("image", image);

      showStatus("⏳ 送信中...");

      fetch("https://script.google.com/macros/s/AKfycbwxIWR74tmegV5r2vOp9tsnVCt2v-zWTBTU4i-FYA1zcOAa2qjk1DbLHnkRFVz43uVHXg/exec", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        },
        body: params
      })
        .then(res => res.text())
        .then(text => {
          if (text.includes("✅")) {
            showStatus("✅ 送信成功: " + text);
          } else {
            showStatus("⚠ 応答: " + text, true);
          }
        })
        .catch(err => {
          showStatus("❌ 送信失敗: " + err.message, true);
          console.error(err);
        });

    } catch (err) {
      showStatus("❌ 例外: " + err.message, true);
      console.error(err);
    }
  }

  let status = "waiting";
  const rootNode = document.querySelector("main") || document.body;

  const observer = new MutationObserver(() => {
    const loggedOut = isLoggedOut();
    const index = loggedOut ? 2 : 1;
    const runButton = getRunButtonByIndex(index);
    if (!runButton) return;

    const disabled = runButton.classList.contains("Button_disabled__P_CVQ");

    if (status === "waiting" && disabled) {
      status = "running";
      t("🔄 計算開始");
    } else if (status === "running" && !disabled) {
      status = "waiting";
      t("✅ 計算完了");
      sendResult();
    }
  });

  observer.observe(rootNode, { childList: true, subtree: true });

})();

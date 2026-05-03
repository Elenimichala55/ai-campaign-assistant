const form = document.getElementById("campaignForm");
const output = document.getElementById("output");
const sourceText = document.getElementById("sourceText");
const loading = document.getElementById("loading");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const platformCardsContainer = document.getElementById("platformCards");
const visualPromptText = document.getElementById("visualPromptText");
const visualPlatformSelect = document.getElementById("visualPlatformSelect");
const generateVisualBtn = document.getElementById("generateVisualBtn");
const downloadVisualBtn = document.getElementById("downloadVisualBtn");
const visualPreviewBox = document.getElementById("visualPreviewBox");

let latestCampaign = "";
let latestPlatforms = [];
let latestVisualPrompt = "";
let latestVisualUrl = null;

function getCampaignData() {
    return {
        brand: document.getElementById("brand").value,
        product: document.getElementById("product").value,
        target_audience: document.getElementById("target_audience").value,
        campaign_goal: document.getElementById("campaign_goal").value,
        tone: document.getElementById("tone").value,
        platform: document.getElementById("platform").value,
        budget_level: document.getElementById("budget_level").value
    };
}

function setCampaignForm(data) {
    if (!data) return;

    document.getElementById("brand").value = data.brand || "";
    document.getElementById("product").value = data.product || "";
    document.getElementById("target_audience").value = data.target_audience || "";
    document.getElementById("campaign_goal").value = data.campaign_goal || "";
    document.getElementById("tone").value = data.tone || "Energetic";
    document.getElementById("platform").value = data.platform || "Instagram";
    document.getElementById("budget_level").value = data.budget_level || "Medium";
}

function renderCampaignOutput(text) {
    if (window.marked) {
        output.innerHTML = marked.parse(text);
    } else {
        output.innerHTML = `<p>${text.replace(/\n/g, "<br>")}</p>`;
    }
}

function stripMarkdown(text) {
    return text
        .replace(/[#>*`_-]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function showToast(message) {
    const existingToast = document.querySelector(".toast");

    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2500);
}

function renderPlatformCards(cards) {
    if (!cards || cards.length === 0) {
        platformCardsContainer.innerHTML = `<p class="empty">Generate a campaign to see platform-specific cards.</p>`;
        return;
    }

    platformCardsContainer.innerHTML = cards.map(card => `
        <div class="platform-card">
            <h3>${card.platform}</h3>
            <p class="platform-meta">${card.content_format}</p>

            <div class="platform-block">
                <strong>Audience Angle</strong>
                <p>${card.audience_angle}</p>
            </div>

            <div class="platform-block">
                <strong>Hook</strong>
                <p>${card.hook}</p>
            </div>

            <div class="platform-block">
                <strong>Caption</strong>
                <p>${card.caption}</p>
            </div>

            <div class="platform-block">
                <strong>CTA</strong>
                <p>${card.cta}</p>
            </div>

            <div class="platform-block">
                <strong>Creative Direction</strong>
                <p>${card.creative_direction}</p>
            </div>
        </div>
    `).join("");
}

function renderVisualPrompt(prompt) {
    if (!prompt) {
        visualPromptText.textContent = "Generate a campaign first to see the visual prompt.";
        return;
    }

    visualPromptText.textContent = prompt;
}

function renderVisualImage(imageUrl) {
    if (!imageUrl) {
        visualPreviewBox.innerHTML = `<p class="empty">No visual generated yet.</p>`;
        return;
    }

    visualPreviewBox.innerHTML = `<img src="${imageUrl}" alt="Generated campaign visual">`;
}

function renderLocalMarketingVisual(campaignData, selectedPlatform) {
    const title = campaignData.product;
    const audience = campaignData.target_audience;
    const goal = campaignData.campaign_goal;

    visualPreviewBox.innerHTML = `
        <div id="generatedAd" class="generated-ad">
            <div class="ad-platform">${selectedPlatform} Campaign</div>

            <div class="ad-main">
                <div class="ad-brand">${campaignData.brand}</div>
                <div class="ad-title">${title}</div>
                <div class="ad-subtitle">
                    Built for ${audience}. Designed to help you ${goal.toLowerCase()}.
                </div>
            </div>

            <div class="ad-footer">
                <div class="ad-cta">Discover More</div>
                <div class="ad-tone">${campaignData.tone} · ${campaignData.budget_level} Budget</div>
            </div>
        </div>
    `;

    downloadVisualBtn.disabled = false;
}

function saveToHistory(input, result, source, platforms, visualPrompt, visualUrl) {
    const history = JSON.parse(localStorage.getItem("campaignHistory")) || [];

    history.unshift({
        input: input,
        brand: input.brand,
        product: input.product,
        platform: input.platform,
        tone: input.tone,
        source: source,
        preview: stripMarkdown(result).slice(0, 220),
        fullOutput: result,
        platforms: platforms,
        visualPrompt: visualPrompt,
        visualUrl: visualUrl,
        createdAt: new Date().toLocaleString()
    });

    localStorage.setItem("campaignHistory", JSON.stringify(history.slice(0, 6)));
    renderHistory();
}

function loadHistoryItem(index) {
    const history = JSON.parse(localStorage.getItem("campaignHistory")) || [];
    const item = history[index];

    if (!item || !item.fullOutput) {
        showToast("Campaign could not be loaded.");
        return;
    }

    setCampaignForm(item.input);

    latestCampaign = item.fullOutput;
    latestPlatforms = item.platforms || [];
    latestVisualPrompt = item.visualPrompt || "";
    latestVisualUrl = item.visualUrl || null;

    renderCampaignOutput(item.fullOutput);
    renderPlatformCards(latestPlatforms);
    renderVisualPrompt(latestVisualPrompt);
    renderVisualImage(latestVisualUrl);

    sourceText.textContent = `Loaded from history: ${item.source}`;

    downloadBtn.disabled = false;
    copyBtn.disabled = false;
    generateVisualBtn.disabled = !latestVisualPrompt;
    downloadVisualBtn.disabled = !latestVisualUrl;

    output.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    showToast("Campaign loaded from history.");
}

window.loadHistoryItem = loadHistoryItem;

function renderHistory() {
    const history = JSON.parse(localStorage.getItem("campaignHistory")) || [];

    if (history.length === 0) {
        historyList.innerHTML = `<p class="empty">No saved campaigns yet.</p>`;
        return;
    }

    historyList.innerHTML = history.map((item, index) => `
        <button class="history-item" type="button" onclick="loadHistoryItem(${index})">
            <strong>${item.brand} - ${item.product}</strong>
            <p>${item.platform} | ${item.tone} | ${item.source}</p>
            <p>${item.preview}...</p>
            <p><small>${item.createdAt}</small></p>
        </button>
    `).join("");
}

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const campaignData = getCampaignData();

    loading.classList.remove("hidden");
    generateBtn.disabled = true;
    downloadBtn.disabled = true;
    copyBtn.disabled = true;
    generateVisualBtn.disabled = true;
    downloadVisualBtn.disabled = true;

    output.innerHTML = `<p class="placeholder">Generating strategy...</p>`;
    platformCardsContainer.innerHTML = `<p class="empty">Generating channel playbooks...</p>`;
    visualPromptText.textContent = "Preparing creative direction...";
    renderVisualImage(null);

    sourceText.textContent = "Generating campaign plan...";

    try {
        const response = await fetch("/generate-campaign", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(campaignData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Something went wrong.");
        }

        latestCampaign = data.output;
        latestPlatforms = data.platforms || [];
        latestVisualPrompt = data.visual_prompt || "";
        latestVisualUrl = data.visual_url || null;

        renderCampaignOutput(data.output);
        renderPlatformCards(latestPlatforms);
        renderVisualPrompt(latestVisualPrompt);
        renderVisualImage(latestVisualUrl);

        sourceText.textContent = `Generated using: ${data.source}`;

        downloadBtn.disabled = false;
        copyBtn.disabled = false;
        generateVisualBtn.disabled = !latestVisualPrompt;
        downloadVisualBtn.disabled = !latestVisualUrl;

        saveToHistory(
            campaignData,
            data.output,
            data.source,
            latestPlatforms,
            latestVisualPrompt,
            latestVisualUrl
        );

        showToast("Campaign generated.");

    } catch (error) {
        output.innerHTML = `<p class="placeholder">Error: ${error.message}</p>`;
        sourceText.textContent = "Generation failed.";
        platformCardsContainer.innerHTML = `<p class="empty">Generation failed.</p>`;
        visualPromptText.textContent = "No visual prompt available.";
        showToast("Campaign generation failed.");
    } finally {
        loading.classList.add("hidden");
        generateBtn.disabled = false;
    }
});

generateVisualBtn.addEventListener("click", async function () {
    if (!latestVisualPrompt) {
        showToast("Generate a campaign first.");
        return;
    }

    const campaignData = getCampaignData();
    const selectedVisualPlatform = visualPlatformSelect.value;

    generateVisualBtn.disabled = true;
    downloadVisualBtn.disabled = true;
    visualPreviewBox.innerHTML = `<p class="empty">Generating visual...</p>`;

    try {
        const response = await fetch("/generate-visual", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ...campaignData,
                platform: selectedVisualPlatform,
                visual_prompt: latestVisualPrompt
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Visual generation failed.");
        }

        latestVisualUrl = data.image_url || null;
        renderVisualPrompt(data.visual_prompt);

        if (data.image_url) {
            renderVisualImage(data.image_url);
            downloadVisualBtn.disabled = false;
            showToast(`Visual generated using ${data.source}.`);
        } else {
            renderLocalMarketingVisual(campaignData, selectedVisualPlatform);
            showToast("Image API unavailable. Local visual generated.");
        }

        const history = JSON.parse(localStorage.getItem("campaignHistory")) || [];
        if (history.length > 0) {
            history[0].visualUrl = latestVisualUrl;
            localStorage.setItem("campaignHistory", JSON.stringify(history));
            renderHistory();
        }

    } catch (error) {
        renderLocalMarketingVisual(campaignData, selectedVisualPlatform);
        showToast("External image failed. Local visual generated.");
    } finally {
        generateVisualBtn.disabled = false;
    }
});

downloadBtn.addEventListener("click", function () {
    if (!latestCampaign) return;

    const blob = new Blob([latestCampaign], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "campaign-strategy.txt";
    link.click();

    URL.revokeObjectURL(url);
    showToast("Strategy downloaded.");
});

copyBtn.addEventListener("click", async function () {
    if (!latestCampaign) return;

    try {
        await navigator.clipboard.writeText(latestCampaign);
        showToast("Strategy copied.");
    } catch (error) {
        showToast("Could not copy text.");
    }
});

downloadVisualBtn.addEventListener("click", async function () {
    const generatedAd = document.getElementById("generatedAd");

    if (generatedAd && window.html2canvas) {
        const canvas = await html2canvas(generatedAd, {
            backgroundColor: null,
            scale: 2
        });

        const link = document.createElement("a");
        link.download = "campaign-visual.png";
        link.href = canvas.toDataURL("image/png");
        link.click();

        showToast("Visual downloaded.");
        return;
    }

    const image = visualPreviewBox.querySelector("img");

    if (image) {
        const link = document.createElement("a");
        link.href = image.src;
        link.download = "campaign-visual.png";
        link.click();
        showToast("Visual opened for download.");
        return;
    }

    showToast("No downloadable visual available.");
});

clearHistoryBtn.addEventListener("click", function () {
    localStorage.removeItem("campaignHistory");
    renderHistory();
    showToast("History cleared.");
});

renderHistory();
renderPlatformCards([]);
renderVisualImage(null);
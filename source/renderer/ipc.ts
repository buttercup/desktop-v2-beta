import { ipcRenderer } from "electron";
import { UpdateInfo } from "electron-updater";
import { getCurrentSourceID, setVaultsList } from "./state/vaults";
import { showAddVaultMenu } from "./state/addVault";
import { showPreferences } from "./state/preferences";
import { showAbout } from "./state/about";
import { setFileHostCode } from "./state/fileHost";
import { setSearchVisible } from "./state/search";
import { fetchUpdatedFacade } from "./actions/facade";
import { unlockVaultSource } from "./actions/unlockVault";
import { applyCurrentUpdateState, applyReadyUpdateState, applyUpdateProgress } from "./services/update";
import { showUpdateError } from "./services/notifications";
import { UpdateProgressInfo, VaultSourceDescription } from "./types";

ipcRenderer.on("add-vault", evt => {
    showAddVaultMenu(true);
});

ipcRenderer.on("file-host-code", (evt, payload) => {
    const { code } = JSON.parse(payload);
    setFileHostCode(code);
});

ipcRenderer.on("open-about", evt => {
    showAbout(true);
});

ipcRenderer.on("open-preferences", evt => {
    showPreferences(true);
});

ipcRenderer.on("open-search", evt => {
    const currentSourceID = getCurrentSourceID();
    if (!currentSourceID) return;
    setSearchVisible(true);
});

ipcRenderer.on("open-source", (evt, sourceID) => {
    window.location.hash = `/source/${sourceID}`;
});

ipcRenderer.on("source-updated", (evt, sourceID) => {
    const currentSourceID = getCurrentSourceID();
    if (sourceID === currentSourceID) {
        fetchUpdatedFacade(sourceID);
    }
});

ipcRenderer.on("unlock-vault", async (evt, sourceID) => {
    await unlockVaultSource(sourceID);
});

ipcRenderer.on("unlock-vault-open", async (evt, sourceID) => {
    await unlockVaultSource(sourceID);
    window.location.hash = `/source/${sourceID}`;
});

ipcRenderer.on("update-available", async (evt, updatePayload) => {
    const updateInfo = JSON.parse(updatePayload) as UpdateInfo;
    applyCurrentUpdateState(updateInfo);
});

ipcRenderer.on("update-downloaded", async (evt, updatePayload) => {
    const updateInfo = JSON.parse(updatePayload) as UpdateInfo;
    applyReadyUpdateState(updateInfo);
});

ipcRenderer.on("update-error", (evt, err) => {
    showUpdateError(err);
});

ipcRenderer.on("update-progress", (evt, prog) => {
    const progress = JSON.parse(prog) as UpdateProgressInfo;
    applyUpdateProgress(progress);
});

ipcRenderer.on("vaults-list", (evt, payload) => {
    const vaults = JSON.parse(payload) as Array<VaultSourceDescription>;
    setVaultsList(vaults);
});

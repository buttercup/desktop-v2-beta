import { ipcRenderer } from "electron";
import { setBusy } from "../state/app";
import { logErr, logInfo } from "../library/log";
import { getCreateNewFilePromptEmitter } from "../services/addVault";
import { showNewFilePrompt } from "../state/addVault";
import { AddVaultPayload, DatasourceConfig } from "../types";

type NewVaultChoice = "new" | "existing" | null;

export async function addNewVaultTarget(
    datasourceConfig: DatasourceConfig,
    password: string,
    createNew: boolean
) {
    setBusy(true);
    const addNewVaultPromise = new Promise<void>((resolve, reject) => {
        ipcRenderer.once("add-vault-config:reply", (evt, payload) => {
            const { ok, error } = JSON.parse(payload) as { ok: boolean, error?: string };
            if (ok) return resolve();
            reject(new Error(`Failed adding vault: ${error}`));
        });
    });
    const payload: AddVaultPayload = {
        createNew,
        datasourceConfig,
        masterPassword: password
    };
    logInfo(`Adding new vault: ${datasourceConfig.type}`);
    ipcRenderer.send("add-vault-config", JSON.stringify(payload));
    try {
        await addNewVaultPromise;
        setBusy(false);
    } catch (err) {
        logErr(err);
        setBusy(false);
        // @todo show error
    }
}

export async function getFileVaultParameters(): Promise<{ filename: string, createNew: boolean } | null> {
    showNewFilePrompt(true);
    const emitter = getCreateNewFilePromptEmitter();
    const choice: NewVaultChoice = await new Promise<NewVaultChoice>(resolve => {
        const callback = (choice: NewVaultChoice) => {
            resolve(choice);
            emitter.removeListener("choice", callback);
        };
        emitter.once("choice", callback);
    });
    showNewFilePrompt(false);
    if (!choice) return null;
    if (choice === "new") {
        const filename = await ipcRenderer.invoke("get-new-vault-filename");
        if (!filename) return null;
        return {
            filename,
            createNew: true
        };
    } else {
        const filename = await ipcRenderer.invoke("get-existing-vault-filename");
        if (!filename) return null;
        return {
            filename,
            createNew: false
        };
    }
}

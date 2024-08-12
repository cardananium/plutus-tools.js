import {applyArgsToPlutusScript, normalizePlutusScript} from "./index"
import { fromHex } from "@harmoniclabs/uint8array-utils";
import { describe, it, expect } from '@jest/globals'

const serialized: Uint8Array = fromHex("59022301000032323232323232323232323232223232323232533300c3370e9000001099999199111980711299980a80089128008a99980919baf301630180010041300530180011300230170010012322230020033756602c0026ea4004dd7180900099199180511998011bab001232223002003374c002244a002464a66601e6ae8c0044894004488c00800ccc02894ccc03ccdd78009ba8480004894004488c00800c004004dd598091918091809180900098088021299980699807180780099111801001a4008264649319999806111299980a00089128008a9998089801180b800899111801001980b800899801801180b0009199119baf374e60300046e9cc06000530012bd8799fd8799f5820259ed76ff84d400c11eabbaed704ce77122d727a2b919f9c49f496c528601da9ff01ff00001001200116332300c22533301300114bd700998079801980b0009801180a8009180a180a8009bac30130051533300d3300e300f0013222300200332337029000000a40082930b0b0b180980118070009baa300f300e002300f300e001300e001223300422533300b00110051323330053011300f00223300933760601c602000600200420026004601a00200297adef6c602323002233002002001230022330020020015740ae6888cc0088cc0088cdc38010008a5013300124a0294494ccc00800448940044c94ccc00c0044c888c00800cdd69804180300109128009802000aab9f5573aae895d0918011baa0015573d");
const args: Uint8Array = fromHex("d8799fd8799f581ca183bf86925f66c579a3745c9517744399679b090927b8f6e2f2e1bb4f616461706541696c656e416d61746fffd8799f581c9a4e855293a0b9af5e50935a331d83e7982ab5b738ea0e6fc0f9e6564e4652414d455f36353030335f4c30ff581cbea1c521df58f4eeef60c647e5ebd88c6039915409f9fd6454a476b9ff");
const expected: Uint8Array = fromHex("5902b05902ad010000332323232323232323232323232223232323232533300c3370e9000001099999199111980711299980a80089128008a99980919baf301630180010041300530180011300230170010012322230020033756602c0026ea4004dd7180900099199180511998011bab001232223002003374c002244a002464a66601e6ae8c0044894004488c00800ccc02894ccc03ccdd78009ba8480004894004488c00800c004004dd598091918091809180900098088021299980699807180780099111801001a4008264649319999806111299980a00089128008a9998089801180b800899111801001980b800899801801180b0009199119baf374e60300046e9cc0600053012bd8799fd8799f5820259ed76ff84d400c11eabbaed704ce77122d727a2b919f9c49f496c528601da9ff01ff00001001200116332300c22533301300114bd700998079801980b0009801180a8009180a180a8009bac30130051533300d3300e300f0013222300200332337029000000a40082930b0b0b180980118070009baa300f300e002300f300e001300e001223300422533300b00110051323330053011300f00223300933760601c602000600200420026004601a00200297adef6c602323002233002002001230022330020020015740ae6888cc0088cc0088cdc38010008a5013300124a0294494ccc00800448940044c94ccc00c0044c888c00800cdd69804180300109128009802000aab9f5573aae895d0918011baa0015573c980185d8799fd8799f581ca183bf86925f66c579a3745c9517744399679b090927b8f6e2f2e1bb4f616461706541696c656e416d61746fffd8799f581c9a4e855293a0b9af5e50935a331d83e7982ab5b738ea0e6fc0f9e6564e4652414d455f36353030335f4c30ff581cbea1c521df58f4eeef60c647e5ebd88c6039915409f9fd6454a476b9ff0001")

describe("applyArgs", () => {
    it("should apply arguments to a UPLC program", () => {
        let program = applyArgsToPlutusScript([args], serialized, "DoubleCBOR");
        expect(program).toEqual(expected);
    });
});

describe("normalizePlutusScript", () => {
    it("should normalize a Plutus script, single wrap", () => {
        let normalized = normalizePlutusScript(new Uint8Array([0x01, 0x00, 0x00]), "SingleCBOR");
        expect(normalized).toEqual(new Uint8Array([0x43, 0x01, 0x00, 0x00]));
    });
    it("should normalize a Plutus script, double wrap", () => {
        let normalized = normalizePlutusScript(new Uint8Array([0x01, 0x00, 0x00]), "DoubleCBOR");
        expect(normalized).toEqual(new Uint8Array([0x44, 0x43, 0x01, 0x00, 0x00]));
    });
    it("should normalize a Plutus script, no wrap", () => {
        let normalized = normalizePlutusScript(new Uint8Array([0x01, 0x00, 0x00]), "PurePlutusScriptBytes");
        expect(normalized).toEqual(new Uint8Array([0x01, 0x00, 0x00]));
    });
    it('should throw exception on incorrect data', () => {
        expect(() => {
            normalizePlutusScript(new Uint8Array([0x01, 0x00]), "SingleCBOR");
        }).toThrowError("Unsupported Plutus version or invalid Plutus script bytes");
    });
    it('should throw exception on incorrect version', () => {
        expect(() => {
            normalizePlutusScript(new Uint8Array([0x01, 0x99, 0x00]), "SingleCBOR");
        }).toThrowError("Unsupported Plutus version or invalid Plutus script bytes");
    });
});

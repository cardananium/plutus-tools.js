import { dataFromCbor } from "@harmoniclabs/plutus-data";
import { parseUPLC, Application, UPLCProgram, UPLCConst, encodeUPLC } from "@harmoniclabs/uplc";
import { Cbor, CborBytes } from "@harmoniclabs/cbor";

const supportedPlutusCoreVersions = [
    {
        version: [1, 0, 0],
        language: "Plutus V1"
    },
    {
        version: [1, 1, 0],
        language: "Plutus V3"
    }
]

export type OutputEncoding = "SingleCBOR" | "DoubleCBOR" | "PurePlutusScriptBytes";


/**
 * Applies arguments to a Plutus script, effectively parameterizing the script with provided data.
 *
 * @param {Uint8Array[]} args - An array of arguments to be applied to the script, each as a Uint8Array.
 * @param {Uint8Array} program - The original Plutus script as a Uint8Array.
 * @param {OutputEncoding} outputEncoding - The desired encoding for the output.
 * @returns {Uint8Array} The modified Plutus script with applied arguments.
 *
 * @description
 * This function performs the following steps:
 * 1. Extracts the pure Plutus bytes from the input program.
 * 2. Parses the UPLC (Untyped Plutus Core) from the pure Plutus bytes.
 * 3. Decodes the provided arguments from CBOR format.
 * 4. Iterates through the decoded arguments, applying each as a term to the program body.
 * 5. Creates a new UPLC program with the modified body.
 * 6. Encodes the new program and applies the specified output encoding.
 *
 * @note
 * - This function modifies the structure of the Plutus script by applying arguments, which can change its behavior when executed.
 * - The function assumes that the input arguments are in a compatible format (CBOR-encoded) and that the program is a valid Plutus script.
 */
export const applyArgsToPlutusScript = (args: Uint8Array[], program: Uint8Array, outputEncoding: OutputEncoding): Uint8Array => {
    const purePlutusBytes = getPurePlutusBytes(program);
    const parsedProgram = parseUPLC(purePlutusBytes, "flat");
    const decodedArgs = args.map((arg) => dataFromCbor(arg));
    let body = parsedProgram.body;

    for (const plutusData of decodedArgs) {
        const argTerm = UPLCConst.data(plutusData);
        body = new Application(body, argTerm);
    }

    const encodedProgram = new UPLCProgram(parsedProgram.version, body);
    const newPlutusScriptBytes = encodeUPLC(encodedProgram).toBuffer().buffer;
    return applyEncoding(newPlutusScriptBytes, outputEncoding);
}

/**
 * Normalizes a Plutus script by extracting its pure Plutus bytes and applying a specified encoding.
 *
 * @param {Uint8Array} plutusScript - The Plutus script to be normalized as a Uint8Array.
 * @param {OutputEncoding} encoding - The desired encoding for the output.
 * @returns {Uint8Array} The normalized Plutus script.
 *
 * @description
 * This function performs the following steps:
 * 1. Extracts the pure Plutus bytes from the input script.
 * 2. Applies the specified encoding to the pure Plutus bytes.
 *
 * @note
 * - This function is useful for standardizing the format of Plutus scripts, ensuring they are in a consistent state for further processing or comparison.
 * - The normalization process does not modify the logical content of the script, only its representation.
 */
export const normalizePlutusScript = (plutusScript: Uint8Array, encoding: OutputEncoding): Uint8Array => {
    const purePlutusBytes = getPurePlutusBytes(plutusScript);
    return applyEncoding(purePlutusBytes, encoding);
}

const hasSupportedPlutusVersion = (plutusScript: Uint8Array): boolean => {
    if (plutusScript.length < 3) {
        return false;
    }
    const version = [plutusScript[0], plutusScript[1], plutusScript[2]];
    return supportedPlutusCoreVersions.some((supportedVersion) => {
        return supportedVersion.version[0] === version[0]
            && supportedVersion.version[1] === version[1]
            && supportedVersion.version[2] === version[2];
    });
}

const getPurePlutusBytes = (plutusScript: Uint8Array): Uint8Array => {
    let unwrappedScript = plutusScript;
    try {
        while (unwrappedScript.length >= 3) {
            if (hasSupportedPlutusVersion(unwrappedScript)) {
                return unwrappedScript;
            }
            const cbor = Cbor.parse(unwrappedScript);
            if (cbor instanceof CborBytes) {
                unwrappedScript = cbor.bytes;
            } else {
                break;
            }
        }
    } catch (error) {
        console.error("Error parsing Plutus script:", error);
    }
    if (hasSupportedPlutusVersion(unwrappedScript)) {
        return unwrappedScript;
    }
    throw new Error("Unsupported Plutus version or invalid Plutus script bytes");
}

const applyCborEncoding = (plutusScript: Uint8Array): Uint8Array => {
    return Cbor.encode(new CborBytes(plutusScript)).toBuffer();
}

const applyEncoding = (plutusScript: Uint8Array, outputEncoding: OutputEncoding): Uint8Array => {
    switch (outputEncoding) {
        case "SingleCBOR":
            return applyCborEncoding(plutusScript);
        case "DoubleCBOR":
            return applyCborEncoding(applyCborEncoding(plutusScript));
        case "PurePlutusScriptBytes":
            return plutusScript;
        default:
            return applyCborEncoding(plutusScript);
    }
}




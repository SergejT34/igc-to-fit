#!/usr/bin/env node

import {program} from 'commander'
import figlet from 'figlet'
import IGCParser from 'igc-parser';
import * as fs from 'node:fs';
import {Encoder, Profile} from '@garmin/fitsdk';

console.log(figlet.textSync("IGC 2 FIT"))
program
    .version("1.0.0")
    .description("CLI for converting igc file to fit")
    .option("-s, --src <value>", "Source *.igc file")
    .option("-d, --dst <value>", "Destination *.fit file")
    .parse(process.argv)


/**
 * Converts IGC data to FIT format and saves to file
 * @param {Object} igcData - Parsed IGC data
 * @param {string} outputPath - Path to save the FIT file
 */
function convertIgcToFit(igcData, outputPath) {
    try {
        console.log(`Converting IGC data to FIT format...`);

        // Create a new FIT encoder
        const encoder = new Encoder();

        // FIT timestamps are seconds since UTC 00:00 Dec 31, 1989
        // JavaScript timestamps are milliseconds since Jan 1, 1970
        // FIT timestamp offset in seconds: 631065600
        const FIT_TIMESTAMP_OFFSET = 631065600;

        // Convert JavaScript timestamp (ms) to FIT timestamp (s)
        const toFitTimestamp = (jsTimestamp) => {
            return Math.floor(jsTimestamp / 1000) - FIT_TIMESTAMP_OFFSET;
        };

        // Get first and last timestamps from fixes
        const firstFixTime = new Date(igcData.fixes[0].timestamp).getTime();
        const lastFixTime = new Date(igcData.fixes[igcData.fixes.length - 1].timestamp).getTime();
        const totalElapsedTime = (lastFixTime - firstFixTime) / 1000; // in seconds

        // Flight date as FIT timestamp
        const flightDate = new Date(igcData.date);
        const flightTimestamp = toFitTimestamp(flightDate.getTime());

        // Add a file ID message
        const fileIdMesg = {
            type: "activity",
            manufacturer: "development",
            product: 0,
            timeCreated: toFitTimestamp(firstFixTime),
            serialNumber: 1234,
        };
        encoder.onMesg(Profile.MesgNum.FILE_ID, fileIdMesg);

        // Add an activity message
        const activityMesg = {
            timestamp: toFitTimestamp(lastFixTime),
            totalTimerTime: totalElapsedTime,
            numSessions: 1,
        };
        encoder.onMesg(Profile.MesgNum.ACTIVITY, activityMesg);

        // Add a session message
        const sessionMesg = {
            messageIndex: 0,
            timestamp: toFitTimestamp(lastFixTime),
            startTime: toFitTimestamp(firstFixTime),
            totalElapsedTime: totalElapsedTime,
            totalTimerTime: totalElapsedTime,
            sport: "flying",
            subSport: "flyParaglide",
            totalDistance: igcData.distance || 0,
            firstLapIndex: 0,
            numLaps: 1,
        };
        encoder.onMesg(Profile.MesgNum.SESSION, sessionMesg);

        // Add a lap message
        const lapMesg = {
            timestamp: toFitTimestamp(lastFixTime),
            startTime: toFitTimestamp(firstFixTime),
            totalElapsedTime: totalElapsedTime,
            totalDistance: igcData.distance || 0,
        };
        encoder.onMesg(Profile.MesgNum.LAP, lapMesg);

        // Add record messages for each fix
        for (const fix of igcData.fixes) {
            const fixTime = new Date(fix.timestamp).getTime();
            const recordMesg = {
                timestamp: toFitTimestamp(fixTime),
                positionLat: Math.round(fix.latitude * (Math.pow(2, 31) / 180)), // Convert to semicircles
                positionLong: Math.round(fix.longitude * (Math.pow(2, 31) / 180)), // Convert to semicircles
                altitude: fix.gpsAltitude || 0,
            };
            encoder.onMesg(Profile.MesgNum.RECORD, recordMesg);
        }

        // Close the encoder and get the FIT file as a byte array
        const fitData = encoder.close();

        // Write the FIT file
        fs.writeFileSync(outputPath, Buffer.from(fitData));

        console.log(`FIT file successfully created at ${outputPath}`);
        return true;
    } catch (error) {
        console.error(`Error converting IGC to FIT: ${error.message}`);
        return false;
    }
}

const options = program.opts()

if (options.src && options.dst) {
    if (fs.existsSync(options.src)) {

        let igcData = IGCParser.parse(fs.readFileSync(options.src, 'utf8'));

        if (convertIgcToFit(igcData, options.dst)) {
            console.log(`Successfully converted ${options.src} to ${options.dst}`);
        } else {
            console.error(`Failed to convert ${options.src} to ${options.dst}`);
            process.exit(1);
        }
    } else {
        console.error(`Source file ${options.src} does not exist`);
        process.exit(1);
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniqueArray = exports.uniformMusicStylesMatchStringsBot = exports.getAllIndexes = exports.backendUrl = void 0;
const backendUrl = "http://localhost:3030/api";
exports.backendUrl = backendUrl;
// Return in an array all indexes of the string 'find' found in sring 'str'
const getAllIndexes = (str, find) => {
    const regex = new RegExp(find, "g");
    let result = null;
    const indices = [];
    while ((result = regex.exec(str))) {
        indices.push(result.index);
    }
    return indices;
};
exports.getAllIndexes = getAllIndexes;
// Will name matchStringsBot attributes matchStrings. Used when we search via bot
// Permits to not change the old code now that we get musicStyles from database
const uniformMusicStylesMatchStringsBot = (p_musicStyles) => {
    const musicStyles = p_musicStyles;
    const uniformedMusicStyles = [];
    for (let i = 0; i < musicStyles.length; i++) {
        const musicStyle = musicStyles[i];
        if (musicStyle.matchStringsBot)
            musicStyle.matchStrings = musicStyle.matchStringsBot;
        uniformedMusicStyles.push(musicStyle);
    }
    return uniformedMusicStyles;
};
exports.uniformMusicStylesMatchStringsBot = uniformMusicStylesMatchStringsBot;
// Delete duplicate from the array passed as param
const uniqueArray = (p_array) => {
    return p_array.filter((el, pos) => p_array.indexOf(el) === pos);
};
exports.uniqueArray = uniqueArray;

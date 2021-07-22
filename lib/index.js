"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGenreFoundViaException = exports.determineMusicStylesFromString = exports.determineEventMusicStyles = void 0;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
const determineEventMusicStyles = (backendUrl, eventName, blueRectanglesStrings, eventDescription) => __awaiter(void 0, void 0, void 0, function* () {
    let musicStylesFound = [];
    let foundElectroStringInTitle = false;
    // 1: Test if event name contains a music style, if yes return directly the style(s)
    //    without testing for blue rectangles and description
    musicStylesFound = yield determineMusicStylesFromString({
        backendUrl,
        isBotAsking: false,
        stringToExplore: eventName,
        searchForTitleOrTag: true,
    });
    // If Electro found do not return electro as only style found for the title (pretty common, better to search more)
    if (musicStylesFound.length === 1 && musicStylesFound[0] === "Electro") {
        foundElectroStringInTitle = true;
        musicStylesFound = [];
    }
    // Comment this code because we now want to concat the styles found in title and tags
    // if (musicStylesFound.length > 0 && !foundElectroStringInTitle) {
    //   return musicStylesFound;
    // }
    // 2: Test if blue rectangles contains a music style, if yes return directly the style(s)
    //    without testing for description
    // This for test for each blue rectangle and concat results (if multi genres)
    for (let i = 0; i < blueRectanglesStrings.length; i++) {
        const musicStyleFromBlueRectangle = yield determineMusicStylesFromString({
            backendUrl,
            isBotAsking: false,
            stringToExplore: blueRectanglesStrings[i],
            searchForTitleOrTag: true,
            isForBlueRectangle: true,
        });
        if (musicStyleFromBlueRectangle.length > 0) {
            musicStylesFound = musicStylesFound.concat(musicStyleFromBlueRectangle);
        }
    }
    // Return array of styles via unqiue array function because it could have duplicate from title and tags
    if (musicStylesFound.length > 0)
        return utils_1.uniqueArray(musicStylesFound);
    // 3: Test if description contains a music style, if yes return directly the style(s)
    musicStylesFound = yield determineMusicStylesFromString({
        backendUrl,
        isBotAsking: false,
        stringToExplore: eventDescription,
        searchForTitleOrTag: false,
    });
    if (musicStylesFound.length > 0)
        return musicStylesFound;
    // If no music style found, return an undefined style or Electro if it was found in title
    if (foundElectroStringInTitle) {
        return ["Electro"];
    }
    return ["Indéfini"];
});
exports.determineEventMusicStyles = determineEventMusicStyles;
const determineMusicStylesFromString = ({ backendUrl, isBotAsking, isForBlueRectangle = false, searchForTitleOrTag, stringToExplore, }) => __awaiter(void 0, void 0, void 0, function* () {
    const musicGenres = [];
    const allMusicStyles = (yield axios_1.default.get(`${backendUrl}/music-styles`)).data;
    for (let i = 0; i < allMusicStyles.length; i++) {
        const musicStyle = allMusicStyles[i];
        // If the style is set as search only in title (80's, 90's, etc...) and if we aren't
        // in case where we search in title we go to the next style
        if (musicStyle.searchOnlyInTitle && !searchForTitleOrTag) {
            continue;
        }
        for (let j = 0; j < musicStyle.matchStrings.length; j++) {
            let matchString = musicStyle.matchStrings[j].toLowerCase();
            // Tags from events can have 'white spaces' so we remove them
            if (isForBlueRectangle)
                matchString = matchString.trim();
            // Style recognized
            if (stringToExplore.toLowerCase().includes(matchString)) {
                console.log("matchstring found: " + matchString);
                if (!isGenreFoundViaException({
                    matchString,
                    matchStringExceptions: musicStyle.exceptions || [],
                    stringToExplore: stringToExplore.toLowerCase(),
                })) {
                    musicGenres.push(musicStyle.name);
                    // Try to break to avoid double string style in array (['electro, 'electro])
                    break;
                }
            }
        }
    }
    return musicGenres;
});
exports.determineMusicStylesFromString = determineMusicStylesFromString;
// e.g Punk style was found for string Daft Punk
const isGenreFoundViaException = (params) => {
    const { matchString, matchStringExceptions, stringToExplore } = params;
    let isGenreFoundViaExceptionArray = [];
    // If there is match strings exceptions for this music genre
    if (matchStringExceptions && matchStringExceptions.length > 0) {
        // Get all index of the match string inside string
        // Loop over it later, usefull if there is multiple styles with the same base,
        // For example Bass House and House the two will be found (it wasn't the case with subgenres)
        const indexesMatch = utils_1.getAllIndexes(stringToExplore, matchString);
        // console.log('indexesMatch ', indexesMatch);
        // Loop over all indexes match
        indexesMatch.forEach((indexMatchString, index) => {
            let resultForThisMatchString = [];
            // For each index match string loop over all exceptions
            for (let i = 0; i < matchStringExceptions.length; i++) {
                const matchStringException = matchStringExceptions[i].toLowerCase();
                // If exception found in string
                if (stringToExplore.toLowerCase().includes(matchStringException)) {
                    // With .idexOf(): Search from 0 for the first then from previous indexMatchString
                    let indexToStartIndexOf = index === 0 ? index : indexesMatch[index - 1] + matchString.length;
                    // console.log('indexToStartIndexOf: ', indexToStartIndexOf);
                    console.log(`Test exception for ${matchString}, exception: ${matchStringException}`);
                    const startIndexMatchStringException = stringToExplore.indexOf(matchStringException, indexToStartIndexOf);
                    const endIndexMatchStringException = stringToExplore.indexOf(matchStringException, indexToStartIndexOf) +
                        matchStringException.length;
                    const startIndexMatchString = indexMatchString;
                    const endIndexMatchString = indexMatchString + matchString.length;
                    // console.log("startIndexMatchStringException: ",startIndexMatchStringException);
                    // console.log("endIndexMatchStringException: ",endIndexMatchStringException);
                    // console.log("startIndexMatchString: ",startIndexMatchString);
                    // console.log("endIndexMatchString: ",endIndexMatchString);
                    // Check if match string position is between match string exception
                    // If yes return true because the string was found via the exception
                    if (startIndexMatchString >= startIndexMatchStringException &&
                        endIndexMatchString <= endIndexMatchStringException) {
                        console.log(`Genre ${matchString} found via exception ${matchStringException}`);
                        // When we foind via exception we delete what was before the endIndexMatchString in stringToExplore,
                        // so stringToExplore.indexOf(matchStringException) will not return the first occurence anymore
                        // which was leading to a bug
                        resultForThisMatchString.push(true);
                    }
                    else {
                        resultForThisMatchString.push(false);
                    }
                }
            }
            // console.log('resultForThisMatchString', resultForThisMatchString);
            // If previous match string wasn't exception, push false to array to chech later
            if (resultForThisMatchString.indexOf(true) >= 0)
                isGenreFoundViaExceptionArray.push(true);
            else
                isGenreFoundViaExceptionArray.push(false);
        });
    }
    else {
        return false;
    }
    // Check if false is inside array, if yes string wasn't found via exceptions
    if (isGenreFoundViaExceptionArray.includes(false))
        return false;
    return true;
};
exports.isGenreFoundViaException = isGenreFoundViaException;
// (async () => {
//   console.log(await determineEventMusicStyles(
//     'ceci est un event',
//     ['Stoner Rock', 'Alternative Rock', 'Garage Rock'],
//     'Diabolique d&b à la base être un album solo de l’actrice Emmanuelle Seigner, composé par les Français The Limiñanas et produit à Berlin par l’Américain Anton Newcombe le leader de The Brian Jonestown Massacre . Mais un rêve est venu bouleverser ces plans. Il en est né un vrai groupe, baptisé L’Epée, une tournée, un album intense et quelques lettres d’amour émues au rock\’n\'roll, cette musique qui sauve des vies.'
//   ));
// })();
console.log("toto");

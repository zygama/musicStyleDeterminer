const axios = require('axios');
const { getAllIndexes, uniformMusicStylesMatchStringsBot, uniqueArray } = require('./utils');


const determineEventMusicStyles = async (
  backendUrl,
  p_eventName,
  p_blueRectanglesStrings,
  p_eventDescription
) => {
  let musicStylesFound = [];
  let foundElectroStringInTitle = false;

  // 1: Test if event name contains a music style, if yes return directly the style(s)
  //    without testing for blue rectangles and description
  musicStylesFound = await determineMusicStylesFromString(backendUrl, false, p_eventName, true);
  // If Electro found do not return electro as only style found for the title (pretty common, better to search more)
  if (musicStylesFound.length === 1 && musicStylesFound[0] === 'Electro') {
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
  for (let i = 0; i < p_blueRectanglesStrings.length; i++) {
    const musicStyleFromBlueRectangle = await determineMusicStylesFromString(backendUrl, false, p_blueRectanglesStrings[i], true, true);
    if (musicStyleFromBlueRectangle.length > 0) {
      musicStylesFound = musicStylesFound.concat(musicStyleFromBlueRectangle);

    } 
  }
  // Return array of styles via unqiue array function because it could have duplicate from title and tags
  if (musicStylesFound.length > 0) return uniqueArray(musicStylesFound);

  // 3: Test if description contains a music style, if yes return directly the style(s)
  musicStylesFound = await determineMusicStylesFromString(backendUrl, false, p_eventDescription, false);
  if (musicStylesFound.length > 0) return musicStylesFound;

  // If no music style found, return an undefined style or Electro if it was found in title
  if (foundElectroStringInTitle) {
    return ['Electro']; 
  }
  return ['Indéfini'];
}

const determineMusicStylesFromString = async (backendUrl, p_isBotAsking, p_string, p_searchForTitleOrTag, p_isForBlueRectangle = false) => {
  const musicGenres = [];

  let allMusicStyles = await axios.get(`${backendUrl}/music-styles`);
  allMusicStyles = allMusicStyles.data;

  for (let i = 0; i < allMusicStyles.length; i++) {
    const musicStyle = allMusicStyles[i];

    // If the style is set as search only in title (80's, 90's, etc...) and if we aren't
    // in case where we search in title we go to the next style
    if (musicStyle.searchOnlyInTitle && !p_searchForTitleOrTag) {
      continue;
    }

    for (let j = 0; j < musicStyle.matchStrings.length; j++) {
      let matchString = musicStyle.matchStrings[j].toLowerCase();

      // Tags from events can have 'white spaces' so we remove them
      if (p_isForBlueRectangle) matchString = matchString.trim();

      // Style recognized
      if (p_string.toLowerCase().includes(matchString)) {
        console.log('matchstring found: ' + matchString);

        if (!isGenreFoundViaException(matchString, musicStyle.exceptions, p_string.toLowerCase())) {
          musicGenres.push(musicStyle.name);
          // Try to break to avoid double string style in array (['electro, 'electro])
          break;
        }
      }
    }
  }
  return musicGenres;
}

// e.g punk found for daft punk
const isGenreFoundViaException = (p_matchString, p_matchStringExceptions, p_string) => {
  let isGenreFoundViaExceptionArray = [];

  // If there is match strings exceptions for this music genre
  if (p_matchStringExceptions && p_matchStringExceptions.length > 0) {
    let stringToExplore = p_string;

    // Get all index of the match string inside string
    // Loop over it later, usefull if there is multiple styles with the same base,
    // For example Bass House and House the two will be found (it wasn't the case with subgenres)
    const indexesMatch = getAllIndexes(stringToExplore, p_matchString);
    // console.log('indexesMatch ', indexesMatch);

    // Loop over all indexes match
    indexesMatch.forEach((indexMatchString, index) => {
      let resultForThisMatchString = [];

      // For each index match string loop over all exceptions
      for (let i = 0; i < p_matchStringExceptions.length; i++) {
        const matchStringException = p_matchStringExceptions[i].toLowerCase();

        // If exception found in string
        if (stringToExplore.toLowerCase().includes(matchStringException)) {
          // With .idexOf(): Search from 0 for the first then from previous indexMatchString
          let indexToStartIndexOf = index === 0 ? index : indexesMatch[index - 1] + p_matchString.length;
          // console.log('indexToStartIndexOf: ', indexToStartIndexOf);

          console.log(`Test exception for ${p_matchString}, exception: ${matchStringException}`);
          const startIndexMatchStringException = stringToExplore.indexOf(matchStringException, indexToStartIndexOf);
          const endIndexMatchStringException = stringToExplore.indexOf(matchStringException, indexToStartIndexOf) + matchStringException.length;
          const startIndexMatchString = indexMatchString;
          const endIndexMatchString = indexMatchString + p_matchString.length;

          // console.log("startIndexMatchStringException: ",startIndexMatchStringException);
          // console.log("endIndexMatchStringException: ",endIndexMatchStringException);
          // console.log("startIndexMatchString: ",startIndexMatchString);
          // console.log("endIndexMatchString: ",endIndexMatchString);

          // Check if match string position is between match string exception
          // If yes return true because the string was found via the exception
          if (startIndexMatchString >= startIndexMatchStringException
            && endIndexMatchString <= endIndexMatchStringException) {
            console.log(`Genre ${p_matchString} found via exception ${matchStringException}`);
            // When we foind via exception we delete what was before the endIndexMatchString in stringToExplore,
            // so stringToExplore.indexOf(matchStringException) will not return the first occurence anymore
            // which was leading to a bug
            resultForThisMatchString.push(true);
          } else {
            resultForThisMatchString.push(false);
          }
        }
      }
      // console.log('resultForThisMatchString', resultForThisMatchString);
      // If previous match string wasn't exception, push false to array to chech later
      if (resultForThisMatchString.indexOf(true) >= 0) isGenreFoundViaExceptionArray.push(true)
      else isGenreFoundViaExceptionArray.push(false);
    });
  } else {
    return false;
  }
  // Check if false is inside array, if yes string wasn't found via exceptions
  if (isGenreFoundViaExceptionArray.includes(false)) return false;
  return true;
}

module.exports = {
  determineEventMusicStyles,
  determineMusicStylesFromString,
  isGenreFoundViaException
};

// (async () => {
//   console.log(await determineEventMusicStyles(
//     'ceci est un event',
//     ['Stoner Rock', 'Alternative Rock', 'Garage Rock'],
//     'Diabolique d&b à la base être un album solo de l’actrice Emmanuelle Seigner, composé par les Français The Limiñanas et produit à Berlin par l’Américain Anton Newcombe le leader de The Brian Jonestown Massacre . Mais un rêve est venu bouleverser ces plans. Il en est né un vrai groupe, baptisé L’Epée, une tournée, un album intense et quelques lettres d’amour émues au rock\’n\'roll, cette musique qui sauve des vies.'
//   ));
// })();


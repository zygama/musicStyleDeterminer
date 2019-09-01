const allMusicStyles = require('./music_styles.json');

const determineEventMusicStyles = (
  p_eventName,
  p_blueRectanglesStrings,
  p_eventDescription
) => {
  let musicStylesFound = []; // TODO: declaration seems useless
  let foundElectroStringInTitle = false;

  // 1: Test if event name contains a music style, if yes return directly the style(s)
  //    without testing for blue rectangles and description
  musicStylesFound = determineMusicGenresFromString(p_eventName, true);
  // If Electro found do not return electro as only style found for the title (pretty common, better to search more)
  if (musicStylesFound.length === 1 && musicStylesFound[0] === 'Electro') {
    foundElectroStringInTitle = true;
    musicStylesFound = [];
  }
  if (musicStylesFound.length > 0 && !foundElectroStringInTitle) {
    console.log(foundElectroStringInTitle);
    return musicStylesFound;
  }

  // 2: Test if blue rectangles contains a music style, if yes return directly the style(s)
  //    without testing for description
  // This for test for each blue rectangle and concat results (if multi genres)
  for (let i = 0; i < p_blueRectanglesStrings.length; i++) {
    const musicStyleFromBlueRectangle = determineMusicGenresFromString(p_blueRectanglesStrings[i], true, true);
    if (musicStyleFromBlueRectangle.length > 0) musicStylesFound = musicStylesFound.concat(musicStyleFromBlueRectangle);
  }
  if (musicStylesFound.length > 0) return musicStylesFound;

  // 3: Test if description contains a music style, if yes return directly the style(s)
  musicStylesFound = determineMusicGenresFromString(p_eventDescription, false);
  if (musicStylesFound.length > 0) return musicStylesFound;

  // If no music style found, return an undefined style or Electro if it was found in title
  if (foundElectroStringInTitle) {
    return ['Electro'];
  }
  return ['Indéfini'];
}

const determineMusicGenresFromString = (p_string, p_searchForTitleOrTag, p_isForBlueRectangle = false) => {
  const musicGenres = [];
  let subgenreFound = false;

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
        subgenreFound = false;
        // But if there is a subgenre maybe we can find a more precise style
        if (musicStyle.subgenres) {
          for (let k = 0; k < musicStyle.subgenres.length; k++) {
            const musicStyleSubgenre = musicStyle.subgenres[k];

            for (let l = 0; l < musicStyleSubgenre.matchStrings.length; l++) {
              const matchStringSubgenre = musicStyleSubgenre.matchStrings[l].toLowerCase();

              if (p_string.toLowerCase().includes(matchStringSubgenre)) {
                // Cast to array for matchStringSubgenre because function treats on arrays (for the use
                // inside the if (!subgenreFound) which need to check for all matchStrings before pushing)
                if (!isGenreFoundViaException([matchStringSubgenre], musicStyle.exceptions, p_string.toLowerCase())) {
                  musicGenres.push(musicStyleSubgenre.name);
                  subgenreFound = true;
                }
                break;
              }
            }
          }
          // Case no subgenre found or when there was no subgenre for that style
        } if (!subgenreFound) {
          if (!isGenreFoundViaException(musicStyle.matchStrings, musicStyle.exceptions, p_string.toLowerCase())) {
            musicGenres.push(musicStyle.name);
            // Other cases
          }
          break;
        }
      }
    }
  }
  return musicGenres;
}

// e.g punk found for daft punk
const isGenreFoundViaException = (p_matchStrings, p_matchStringExceptions, p_string) => {
  let isGenreFoundViaException = false;

  if (p_matchStringExceptions) {
    for (let i = 0; i < p_matchStringExceptions.length; i++) {
      const matchStringException = p_matchStringExceptions[i].toLowerCase();

      for (let j = 0; j < p_matchStrings.length; j++) {
        const matchString = p_matchStrings[j].toLowerCase();

        if (p_string.toLowerCase().includes(matchStringException)) {
          console.log(`Test exception for ${matchString}, exception: ${matchStringException}`);
          const startIndexMatchStringException = p_string.indexOf(matchStringException);
          const endIndexMatchStringException = p_string.indexOf(matchStringException) + matchStringException.length;
          const startIndexMatchString = p_string.indexOf(matchString);
          const endIndexMatchString = p_string.indexOf(matchString) + matchString.length;

          // Check if match string position is between match string exception
          // If yes return true because the string was found via the exception
          if (startIndexMatchString >= startIndexMatchStringException
            && endIndexMatchString <= endIndexMatchStringException) {
            console.log(`Genre ${matchString} found via exception ${matchStringException}`);
            isGenreFoundViaException = true;
            return isGenreFoundViaException;
          }
        }
      }
    }
  }

  return isGenreFoundViaException;
}


module.exports = {
  determineEventMusicStyles,
  determineMusicGenresFromString,
  isGenreFoundViaException
};

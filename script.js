var goButton = document.querySelector('#go');
var nameBox = document.querySelector('#nameOrId');
var imageSquare = document.querySelector('#pkmnImg');
var nameSquare = document.querySelector('#nameSquare');
var pokedexNumber = document.querySelector('#pokedexNumber');
var type1Area = document.querySelector('#type1');
var type2Area = document.querySelector('#type2');
var abilityList = document.querySelector('#abilityList');

// listen to the go button click event
goButton.addEventListener('click', () => {
    const nameOrId = nameBox.value.trim().toLowerCase();
    nameBox.value = ''; // empty the input box after retrieving the value
    const pokemon = findPokemonInLS(nameOrId);
    pokemon ? populateScreen(pokemon) : getPkmnData(nameOrId);
});

/**
 * Retrieves the local Pokédex from local storage.
 * @returns {Array} An array of Pokémon objects stored in local storage.
 */
function getLocalPokedex() {
    const pokedexString = localStorage.getItem('pokedex');
    const pokedex = pokedexString ? JSON.parse(pokedexString) : [];
    return pokedex;
} 

/**
 * Searches for a Pokémon in the local Pokédex by its name or ID.
 * @param {string|number} nameOrId - The name or ID of the Pokémon to search for.
 * @param {Array} pokedex - The local Pokédex array to search within.
 * @returns {Object|null} The Pokémon object if found, otherwise null.
 */
function findPokemonInLS(nameOrId) {
    const pokedex = getLocalPokedex();
    return searchLocalPokedex(nameOrId, pokedex);
}


// TODO: use refactor to async 
/**
 * Fetches Pokémon data from the API, including basic data, species data, and evolution data.
 * @param {string|number} nameOrId - The name or ID of the Pokémon to fetch data for.
 */
function getPkmnData(nameOrId) {
    getBasicPokemonData$(nameOrId)
        .then(basicData => {
            // bypass the old api
            // const speciesURL = basicData.speciesURL.replace('pokeapi.co/api/v2/', 'jb-pkmn-api-5c3f0f0810fe.herokuapp.com/')
            getSpeciesData$(basicData.speciesURL)
                .then(speciesData => {
                    const evoChainURL = speciesData.evolution_chain.url //.replace('pokeapi.co/api/v2/', 'jb-pkmn-api-5c3f0f0810fe.herokuapp.com/');
                    getEvoData$(evoChainURL)
                        .then(evoData => {
                            // console.log(evoData);
                            const evoChain = evoData.chain;
                            const pkmnSpeciesName = evoChain.species.name;
                            const splitUrlArray = evoChain.species.url.split('/');
                            const pkmnSpeciesId = parseInt(splitUrlArray[splitUrlArray.length-2]);
                            const firstFormData = {
                                name: pkmnSpeciesName,
                                isBaby: evoChain.is_baby,
                                id: pkmnSpeciesId
                            }
                            const evolutions = extractChainData([firstFormData], evoChain);

                            const pkmnData = {
                                ...basicData,
                                evolutions
                            }
                            storeData(pkmnData);
                            populateScreen(pkmnData);
                        })
                })
        })
}

/**
 * Fetches basic Pokémon data from the API.
 * @param {string|number} nameOrId - The name or ID of the Pokémon to fetch basic data for.
 * @returns {Promise<Object>} A promise that resolves to the basic Pokémon data.
 */
function getBasicPokemonData$(nameOrId) {
    return fetch('https://pokeapi.co/api/v2/pokemon/' + nameOrId)
        .then(res => res.json())
        .then(data => {
            // show me the data
            console.log(data);
            // return const pkmnData = extractPkmnData(data);
            return extractPkmnData(data);
        })
}

/**
 * Fetches species data for a Pokémon from the API.
 * @param {string} speciesURL - The URL to fetch the species data from.
 * @returns {Promise<Object>} A promise that resolves to the species data.
 */
function getSpeciesData$(speciesURL) {
    return fetch(speciesURL)
        .then(res => res.json())
        .then(speciesData => {
            console.log(speciesData)
            return speciesData;
        })  
}

/**
 * Fetches evolution chain data for a Pokémon from the API.
 * @param {string} evoChainURL - The URL to fetch the evolution chain data from.
 * @returns {Promise<Object>} A promise that resolves to the evolution chain data.
 */
function getEvoData$(evoChainURL) {
    return fetch(evoChainURL)
        .then(res => res.json())
        .then(evoData => {
            console.log(evoData);
            return evoData;
    });
}

/**
 * Populates the screen with the Pokémon data.
 * @param {Object} data - The Pokémon data to display.
 */
function populateScreen(data) {
    imageSquare.src = data.imageAddress;
    nameSquare.innerHTML = data.name;
    pokedexNumber.innerHTML = data.pokedexEntry;

    const type1 = data.types[0].type.name;
    type1Area.innerHTML = type1;

    if (data.types.length > 1) {
        const type2 = data.types[1].type.name;
        type2Area.innerHTML = type2;
    } else {
        type2Area.innerHTML = 'none';
    }


    abilityList.innerHTML = '';
    data.abilities.forEach(ability => {
        const li = document.createElement('li');
        li.innerHTML = ability.ability.name
        abilityList.appendChild(li);
    })

    const evolutionSection = document.querySelector('#evolutions');
    evolutionSection.innerHTML = '';

    data.evolutions.forEach((evolutionChain) => {
        const div = document.createElement('div');
        evolutionChain.forEach((form) => {
            // const formDiv = `
            // <div style="display:inline-block;">
            //     <img src="${'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + form.id + '.png'}">
            //     <div id="name">${form.name}</div>
            //     <div id="trigger">${form.trigger ? form.trigger : form.isBaby ? 'baby form' : 'base form'}</div>
            // </div>
            // `
            // removed trigger details
            const formDiv = `
            <div style="display:inline-block;">
                <img src="${'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + form.id + '.png'}">
                <div id="name">${form.name}</div>
                <div id="trigger">${form.trigger ? form.trigger : form.isBaby ? 'baby form' : 'base form'}</div>
                <div>${populateTriggerDetails(form.triggerDetails)}</div>
            </div>
            `
            div.innerHTML = div.innerHTML + formDiv;
        })
        evolutionSection.append(div);
    });


    // const evoChain = data.evolutionChain.chain;
    // const chainData = extractChainData([data.name], evoChain);
    // console.log(chainData);
}

/**
 * Extracts evolution chain data recursively.
 * @param {Array} currentData - The current evolution chain data.
 * @param {Object} evoChain - The evolution chain object from the API.
 * @param {Array} options - The array to store extracted evolution options.
 * @param {number} ting - The current index in the evolution chain.
 * @returns {Array} The extracted evolution chain data.
 */
function extractChainData(currentData, evoChain, options = [], ting = 0) {
    evoChain.evolves_to.forEach((option, i) => {
        const splitUrlArray = option.species.url.split('/');
        const pkmnSpeciesId = parseInt(splitUrlArray[splitUrlArray.length-2]);
        const pkmnData = {
            name: option.species.name,
            isBaby: option.is_baby,
            trigger: !!(option.evolution_details[0].trigger.name) && option.evolution_details[0].trigger.name,
            triggerDetails: getTriggerDetails(option.evolution_details[0]),
            id: pkmnSpeciesId
        }
        options[i] = [...currentData, pkmnData];
        if (option.evolves_to.length > 0) {
            evoChain.evolves_to.forEach((opt, c) => {
                extractChainData(options[c], opt, options, c);
            })
        }
    });
    return options;
}

/**
 * Extracts relevant trigger details from the evolution details object.
 * @param {Object} details - The evolution details object from the API.
 * @returns {Object} An object containing the relevant trigger details.
 */
function getTriggerDetails(details) {
    const relevantData = {};
    for (const propKey in details) {
        if (propKey === 'trigger') {
            continue;
        }
        if (!details[propKey]) {
            continue;
        }
        relevantData[propKey] = details[propKey]
    }
    return relevantData;
}
/**
 * Populates a string with the evolution trigger details.
 * @param {Object} details - The evolution trigger details object.
 * @returns {string} A string representation of the evolution trigger details.
 */
function populateTriggerDetails(details) {
    let detailString = ""
    if (details && JSON.stringify(details) === '{}')
        return detailString
    for(detailKey in details) {
        if (typeof details[detailKey] === 'object') {
            detailString += detailKey + ': ' + details[detailKey].name + ' ';
        } else {
            detailString += detailKey + ': ' + details[detailKey] + ' ';
        }
    }
    return detailString;
}

/**
 * Adds evolution chain data to the Pokémon data object.
 * @param {Object} data - The Pokémon data object.
 * @param {Array} chainData - The extracted evolution chain data.
 * @returns {Object} The Pokémon data object with the evolution chain added.
 */
function addEvolutions(data, chainData) {
    return {
        ...data,
        evolutions: chainData
    }
}

// recursive attempt. works for basic evolutions like bulbasaur will come back later
// function extractChainData(evoChain) {
//     console.log(evoChain);
//     if (!evoChain.evolves_to.length) {
//         return [{ name: evoChain.species.name }];
//     }
//     const chain = extractChainData(evoChain.evolves_to[0]);
//     return [ { name: evoChain.species.name }, ...chain ];
// }

/**
 * Searches for a Pokémon in the local Pokédex by its name or ID.
 * @param {string|number} nameOrId - The name or ID of the Pokémon to search for.
 * @param {Array} pokedex - The local Pokédex array to search within.
 * @returns {Object|null} The Pokémon object if found, otherwise null.
 */
function searchLocalPokedex(nameOrId, pokedex) {
    const isId = !(Number.isNaN(+nameOrId));
    return isId ? pokedex[nameOrId] : pokedex.find(pkmn => pkmn?.name === nameOrId);
}
/**
 * Extracts relevant Pokémon data from the API response.
 * @param {Object} data - The API response data for a Pokémon.
 * @returns {Object} An object containing the extracted Pokémon data.
 */
function extractPkmnData(data) {
    return {
        name: data.name,
        pokedexEntry: data.id,
        imageAddress: data.sprites.front_default,
        types: data.types,
        abilities: data.abilities,
        speciesURL: data.species.url
    }
}

/**
 * Stores Pokémon data in the local Pokédex within the browser's local storage.
 * @param {Object} data - The Pokémon data to store.
 */
function storeData(data) {
    // get pokedex from browser storage
    const nationalPokedex = getLocalPokedex();
    // add data into array
    nationalPokedex[+data.pokedexEntry] = data;
    const nationalPokedexString = JSON.stringify(nationalPokedex);
    localStorage.setItem('pokedex', nationalPokedexString);
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .catch((error) => {
                console.error('Service worker registration failed:', error);
            });
    });
}
var goButton = document.querySelector('#go');
var nameBox = document.querySelector('#nameOrId');
var imageSquare = document.querySelector('#pkmnImg');
var nameSquare = document.querySelector('#nameSquare');
var pokedexNumber = document.querySelector('#pokedexNumber');
var type1Area = document.querySelector('#type1');
var type2Area = document.querySelector('#type2');
var abilityList = document.querySelector('#abilityList');

goButton.addEventListener('click', () => {
    const nameOrId = nameBox.value.trim().toLowerCase();
    nameBox.value = '';
    const pokemon = findPokemonInLS(nameOrId);
    pokemon ? populateScreen(pokemon) : getPkmnData(nameOrId);
});

function getLocalPokedex() {
    const pokedexString = localStorage.getItem('pokedex');
    const pokedex = pokedexString ? JSON.parse(pokedexString) : [];
    return pokedex;
} 

function findPokemonInLS(nameOrId) {
    const pokedex = getLocalPokedex();
    return searchLocalPokedex(nameOrId, pokedex);
}


// TODO: use refactor to async 
function getPkmnData(nameOrId) {
    getBasicPokemonData$(nameOrId)
        .then(basicData => {
            const speciesURL = basicData.speciesURL.replace('pokeapi.co/api/v2/', 'jb-pkmn-api-5c3f0f0810fe.herokuapp.com/')
            getSpeciesData$(speciesURL)
                .then(speciesData => {
                    const evoChainURL = speciesData.evolution_chain.url.replace('pokeapi.co/api/v2/', 'jb-pkmn-api-5c3f0f0810fe.herokuapp.com/');
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

function getBasicPokemonData$(nameOrId) {
    return fetch('https://jb-pkmn-api-5c3f0f0810fe.herokuapp.com/pokemon/' + nameOrId)
        .then(res => res.json())
        .then(data => {
            // show me the data
            console.log(data);
            // return const pkmnData = extractPkmnData(data);
            return extractPkmnData(data);
        })
}

function getSpeciesData$(speciesURL) {
    return fetch(speciesURL)
        .then(res => res.json())
        .then(speciesData => {
            console.log(speciesData)
            return speciesData;
        })  
}

function getEvoData$(evoChainURL) {
    return fetch(evoChainURL)
        .then(res => res.json())
        .then(evoData => {
            console.log(evoData);
            return evoData;
    });
}

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

function searchLocalPokedex(nameOrId, pokedex) {
    const isId = !(Number.isNaN(+nameOrId));
    return isId ? pokedex[nameOrId] : pokedex.find(pkmn => pkmn?.name === nameOrId);
}

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

function storeData(data) {
    // get pokedex from browser storage
    const nationalPokedex = getLocalPokedex();
    // add data into array
    nationalPokedex[+data.pokedexEntry] = data;
    const nationalPokedexString = JSON.stringify(nationalPokedex);
    localStorage.setItem('pokedex', nationalPokedexString);
}
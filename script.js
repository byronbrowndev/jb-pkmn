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
    const pokedex = getLocalPokedex();

    const pokemon = searchLocalPokedex(nameOrId, pokedex);
    pokemon ? populateScreen(pokemon) : getPkmnData(nameOrId);
});

function getLocalPokedex() {
    const pokedexString = localStorage.getItem('pokedex');
    const pokedex = pokedexString ? JSON.parse(pokedexString) : [];
    return pokedex;
} 

function getPkmnData(nameOrId) {
    getBasicPokemonData$(nameOrId)
        .then(basicData => {
            const speciesURL = basicData.speciesURL.replace('pokeapi.co/api/v2/', 'jb-pkmn-api-5c3f0f0810fe.herokuapp.com/')
            getSpeciesData$(speciesURL)
                .then(speciesData => {
                    const evoChainURL = speciesData.evolution_chain.url.replace('pokeapi.co/api/v2/', 'jb-pkmn-api-5c3f0f0810fe.herokuapp.com/');
                    getEvoData$(evoChainURL)
                        .then(evoData => {
                            const evoChain = evoData.chain;
                            const pkmnSpeciesName = evoData.chain.species.name
                            const evolutions = extractChainData([pkmnSpeciesName], evoChain);

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

    // get type 1
    const type1 = data.types[0].type.name;
    // put it on the screen
    type1Area.innerHTML = type1;

    // if there is a type 2
    if (data.types.length > 1) {
        // get type 2 put it on the screen
        const type2 = data.types[1].type.name;
        type2Area.innerHTML = type2;
    } else {
        type2Area.innerHTML = 'none';
    }


    abilityList.innerHTML = '';
    // list items for each
    data.abilities.forEach(ability => {
        // create a new list item
        // console.log(ability)
        const li = document.createElement('li');
        // add the ability name to that item
        li.innerHTML = ability.ability.name
        // put that item in the list
        abilityList.appendChild(li);
    })

    // const evoChain = data.evolutionChain.chain;
    // const chainData = extractChainData([data.name], evoChain);
    // console.log(chainData);
}

function extractChainData(currentData, evoChain, options = []) {
    evoChain.evolves_to.forEach((option, i) => {
        options[i] = [...currentData, option.species.name];
        if (option.evolves_to.length > 0) {
            evoChain.evolves_to.forEach((opt, c) => {
                extractChainData(options[c], opt, options, c);
            })
        }
    });
    return options;
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
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
    pokemon ? populateScreen(pokemon) : getBasicPokemonData(nameOrId);
});

function getLocalPokedex() {
    const pokedexString = localStorage.getItem('pokedex');
    const pokedex = pokedexString ? JSON.parse(pokedexString) : [];
    return pokedex;
} 

function getBasicPokemonData(nameOrId) {
    fetch('https://jb-pkmn-api-5c3f0f0810fe.herokuapp.com/pokemon/' + nameOrId)
        .then(res => res.json())
        .then(data => {
            // show me the data
            console.log(data);
            const pkmnData = extractPkmnData(data);
            const speciesURL = pkmnData.speciesURL.replace('pokeapi.co/api/v2/', 'jb-pkmn-api-5c3f0f0810fe.herokuapp.com/')
            fetch(speciesURL)
                .then(res2 => res2.json())
                .then(speciesData => {
                    const evoChainURL = speciesData.evolution_chain.url;
                    fetch(evoChainURL)
                        .then(res3 => res3.json())
                        .then(evoData => {
                            console.log(evoData)
                            pkmnData.evolution_chain = evoData;
                            storeData(pkmnData);
                            populateScreen(pkmnData);
                        })
                })
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
        console.log(ability)
        const li = document.createElement('li');
        // add the ability name to that item
        li.innerHTML = ability.ability.name
        // put that item in the list
        abilityList.appendChild(li);
    })
}

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
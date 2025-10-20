// ===================================================
// APP INITIALIZATION & MAIN NAVIGATION
// ===================================================

let MAIN_CONTENT;

/**
 * Renders the main navigation menu.
 */
function mainMenu() {
    MAIN_CONTENT.innerHTML = `
        <h2>Welcome to the Call of Cthulhu 7e Manager</h2>
        <p>Select a manager from the options below:</p>
        <div class="menu-buttons">
            <button class="btn" onclick="Character.characterMenu()">Investigator Manager</button>
            <button class="btn" onclick="NPC.npcMenu()">NPC Manager</button>
            <button class="btn" onclick="Spell.listAll()">Spell Manager</button>
            <button class="btn" onclick="Weapon.listAll()">Weapon Manager</button>
            <button class="btn" onclick="Combat.renderCombatMenu()">Combat Manager</button>
        </div>
    `;
}

/**
 * Loads all data and starts the application. This is the single entry point.
 */
async function initApp() {
    MAIN_CONTENT = document.getElementById('main');
    if (!MAIN_CONTENT) {
        console.error("Fatal Error: Main content div with id='main' not found!");
        return;
    }

    // Assign mainContent to classes that need a direct reference for rendering UI.
    Character.mainContent = MAIN_CONTENT;
    NPC.mainContent = MAIN_CONTENT;
    Combat.mainContent = MAIN_CONTENT;

    console.log("Loading all data...");
    await Spell.load();
    await Weapon.load();
    Character.load();
    NPC.load();
    Combat.load();
    console.log("All data loaded successfully.");

    mainMenu();
}

// ===================================================
// UTILITY FUNCTIONS
// ===================================================

function loadData(key) {
    try {
        const json = localStorage.getItem(key);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error("Error loading data:", e);
        return [];
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Data saved successfully to localStorage with key: ${key}`);
    } catch (e) {
        console.error("Error saving data to localStorage:", e);
    }
}

function validateNumber(input, max) {
    let number = parseInt(input);
    if (isNaN(number) || number < 0) return 0;
    if (max !== undefined && number > max) return max;
    return number;
}

function loopControl(message) {
    return confirm(message);
}

function createElement(tag, textContent, className, onClick) {
    const element = document.createElement(tag);
    if (textContent !== undefined && textContent !== null) element.textContent = textContent;
    if (className) element.className = className;
    if (onClick) element.onclick = onClick;
    return element;
}

// ===================================================
// CLASS DEFINITIONS
// ===================================================

/**
 * Represents the cost of a spell.
 */
class Cost {
    constructor(MP, SP, PP) {
        this.MP = parseInt(MP) || 0;
        this.SP = parseInt(SP) || 0;
        this.PP = parseInt(PP) || 0;
    }

    static listCost(spellName, spellCost) {
        let parts = [];
        if (spellCost.MP > 0) parts.push(`MP - ${spellCost.MP}`);
        if (spellCost.SP > 0) parts.push(`SP - ${spellCost.SP}`);
        if (spellCost.PP > 0) parts.push(`PP - ${spellCost.PP}`);
        if (parts.length === 0) return `${spellName}: No Cost`;
        return `${spellName}: ${parts.join(", ")}`;
    }
}

/**
 * Manages spells.
 */
class Spell {
    constructor(name, cost, time) {
        this.name = name;
        this.cost = new Cost(cost.MP, cost.SP, cost.PP);
        this.time = time;
    }

    static spells = [];
    static localStorageKey = "CoC7e_UserSpells";

    static async load() {
        const userSpellsRaw = loadData(Spell.localStorageKey);
        Spell.spells = userSpellsRaw
            .map(s => new Spell(s.name, s.cost, s.time))
            .sort((a, b) => a.name.localeCompare(b.name));
        console.log(`Loaded ${Spell.spells.length} spells.`);
    }

    static save() {
        saveData(Spell.localStorageKey, Spell.spells);
    }

    static handleFormSubmit(event) {
        event.preventDefault();
        const name = document.getElementById('spell-name').value.trim();
        const mp = document.getElementById('mp-cost').value;
        const sp = document.getElementById('sp-cost').value;
        const pp = document.getElementById('pp-cost').value;
        const time = document.getElementById('conjuring-time').value.trim();
        const formMessage = document.getElementById('form-message');

        if (!name || !time) {
            formMessage.textContent = 'Please fill in all required fields.';
            formMessage.style.color = 'red';
            return;
        }

        const cost = new Cost(mp, sp, pp);
        const spell = new Spell(name, cost, time);
        const existingIndex = Spell.spells.findIndex(s => s.name.toLowerCase() === name.toLowerCase());

        if (existingIndex > -1) {
            Spell.spells[existingIndex] = spell;
            formMessage.textContent = `Spell "${name}" has been updated!`;
        } else {
            Spell.spells.push(spell);
            formMessage.textContent = `Spell "${name}" has been added!`;
        }

        Spell.spells.sort((a, b) => a.name.localeCompare(b.name));
        Spell.save();
        formMessage.style.color = 'green';
        document.getElementById('new-spell-form').reset();
        document.getElementById('spell-name').focus();
    }

    static delete(spellName) {
        if (loopControl(`Are you sure you want to delete the spell: ${spellName}?`)) {
            const initialLength = Spell.spells.length;
            Spell.spells = Spell.spells.filter(s => s.name !== spellName);
            if (Spell.spells.length < initialLength) {
                Spell.save();
                Spell.listAll();
            }
        }
    }

    static listAll() {
        MAIN_CONTENT.innerHTML = '';
        MAIN_CONTENT.appendChild(createElement('h2', 'Spell Manager'));
        const buttonContainer = createElement('div');
        buttonContainer.appendChild(createElement('button', 'Add New Spell', 'btn', Spell.renderNewSpellForm));
        buttonContainer.appendChild(createElement('button', '← Back to Main Menu', 'btn btn-secondary', mainMenu));
        MAIN_CONTENT.appendChild(buttonContainer);

        if (Spell.spells.length === 0) {
            MAIN_CONTENT.appendChild(createElement('p', 'No spells saved yet. Click "Add New Spell" to begin.'));
            return;
        }

        const ul = createElement('ul', null, 'item-list');
        Spell.spells.forEach(spell => {
            const costString = Cost.listCost(spell.name, spell.cost);
            const safeName = spell.name.replace(/'/g, "\\'");
            const li = createElement('li');
            const infoDiv = createElement('div');
            infoDiv.innerHTML = `<strong>${costString}</strong> (Time: ${spell.time})`;
            const deleteButton = createElement('button', 'Delete', 'btn-delete', () => Spell.delete(safeName));
            li.appendChild(infoDiv);
            li.appendChild(deleteButton);
            ul.appendChild(li);
        });
        MAIN_CONTENT.appendChild(ul);
    }

    static renderNewSpellForm() {
        MAIN_CONTENT.innerHTML = `
            <h2>Add a New Spell</h2>
            <form id="new-spell-form">
                <label for="spell-name">Spell's Name:</label>
                <input type="text" id="spell-name" required>
                <label for="mp-cost">Magic Points (MP) Cost:</label>
                <input type="number" id="mp-cost" value="0" min="0" required>
                <label for="sp-cost">Sanity Points (SP) Cost:</label>
                <input type="number" id="sp-cost" value="0" min="0" required>
                <label for="pp-cost">Power Points (PP) Cost:</label>
                <input type="number" id="pp-cost" value="0" min="0" required>
                <label for="conjuring-time">Conjuring Time:</label>
                <input type="text" id="conjuring-time" required>
                <div>
                   <button class="btn" type="submit">Add/Update Spell</button>
                   <button class="btn btn-secondary" type="button" onclick="Spell.listAll()">Cancel</button>
                </div>
            </form>
            <div id="form-message"></div>
        `;
        document.getElementById('new-spell-form').addEventListener('submit', Spell.handleFormSubmit);
        document.getElementById('spell-name').focus();
    }
}

/**
 * Manages weapons.
 */
class Weapon {
    constructor(name, skill, damage, flagBonus = 0, flagBuild = 0) {
        this.name = name;
        this.skill = skill;
        this.damage = damage;
        this.flagBonus = Number(flagBonus);
        this.flagBuild = Number(flagBuild);
    }

    static weapons = [];
    static localStorageKey = "CoC7e_UserWeapons";

    static async load() {
        const userWeaponsRaw = loadData(Weapon.localStorageKey);
        Weapon.weapons = userWeaponsRaw
            .map(w => new Weapon(w.name, w.skill, w.damage, w.flagBonus, w.flagBuild))
            .sort((a, b) => a.name.localeCompare(b.name));
        console.log(`Loaded ${Weapon.weapons.length} weapons.`);
    }

    static save() {
        saveData(Weapon.localStorageKey, Weapon.weapons);
    }

    static delete(weaponName) {
        if (loopControl(`Are you sure you want to delete the weapon: ${weaponName}?`)) {
            const initialLength = Weapon.weapons.length;
            Weapon.weapons = Weapon.weapons.filter(w => w.name !== weaponName);
            if (Weapon.weapons.length < initialLength) {
                Weapon.save();
                Weapon.listAll();
            }
        }
    }

    static handleFormSubmit(event) {
        event.preventDefault();
        const name = document.getElementById('weapon-name').value.trim();
        const skill = document.getElementById('skill').value.trim();
        const damage = document.getElementById('damage').value.trim();
        const flagBonus = validateNumber(document.getElementById('flagBonus').value, 5);
        const flagBuild = validateNumber(document.getElementById('flagBuild').value, 1);
        const formMessage = document.getElementById('form-message');

        if (Weapon.weapons.some(w => w.name.toLowerCase() === name.toLowerCase())) {
            formMessage.textContent = `Error: Weapon "${name}" already exists.`;
            formMessage.style.color = 'red';
            return;
        }

        const weapon = new Weapon(name, skill, damage, flagBonus, flagBuild);
        Weapon.weapons.push(weapon);
        Weapon.weapons.sort((a, b) => a.name.localeCompare(b.name));
        Weapon.save();

        formMessage.textContent = `Weapon "${name}" has been added and saved!`;
        formMessage.style.color = 'green';
        document.getElementById('new-weapon-form').reset();
        document.getElementById('weapon-name').focus();
    }

    static listAll() {
        MAIN_CONTENT.innerHTML = '';
        MAIN_CONTENT.appendChild(createElement('h2', 'Weapon Manager'));
        const buttonContainer = createElement('div');
        buttonContainer.appendChild(createElement('button', 'Add New Weapon', 'btn', Weapon.renderNewWeaponForm));
        buttonContainer.appendChild(createElement('button', '← Back to Main Menu', 'btn btn-secondary', mainMenu));
        MAIN_CONTENT.appendChild(buttonContainer);

        if (Weapon.weapons.length === 0) {
            MAIN_CONTENT.appendChild(createElement('p', 'No weapons saved yet. Click "Add New Weapon" to create one.'));
            return;
        }

        const ul = createElement('ul', null, 'item-list');
        Weapon.weapons.forEach(weapon => {
            const safeName = weapon.name.replace(/'/g, "\\'");
            const li = createElement('li');
            const infoDiv = createElement('div');
            infoDiv.innerHTML = `
                <strong>${weapon.name}</strong> &ndash; Skill: ${weapon.skill}, 
                Damage: ${weapon.damage}, Bonus Dice: ${weapon.flagBonus}, 
                Uses DB: ${weapon.flagBuild === 1 ? 'Yes' : 'No'}
            `;
            const deleteButton = createElement('button', 'Delete', 'btn-delete', () => Weapon.delete(safeName));
            li.appendChild(infoDiv);
            li.appendChild(deleteButton);
            ul.appendChild(li);
        });
        MAIN_CONTENT.appendChild(ul);
    }

    static renderNewWeaponForm() {
        MAIN_CONTENT.innerHTML = `
            <h2>Add a New Weapon</h2>
            <form id="new-weapon-form">
                <label for="weapon-name">Weapon's Name:</label>
                <input type="text" id="weapon-name" required>
                <label for="skill">Skill (e.g., Fighting (Brawl)):</label>
                <input type="text" id="skill" required>
                <label for="damage">Damage (e.g., 1D3):</label>
                <input type="text" id="damage" required>
                <label for="flagBonus">Bonus/Penalty Dice (e.g., 1 or -1):</label>
                <input type="number" id="flagBonus" value="0" required>
                <label for="flagBuild">Uses Damage Bonus (DB)? (0=No, 1=Yes):</label>
                <input type="number" id="flagBuild" value="0" min="0" max="1" required>
                <div>
                   <button class="btn" type="submit">Add Weapon</button>
                   <button class="btn btn-secondary" type="button" onclick="Weapon.listAll()">Cancel</button>
                </div>
            </form>
            <div id="form-message"></div>
        `;
        document.getElementById('new-weapon-form').addEventListener('submit', Weapon.handleFormSubmit);
        document.getElementById('weapon-name').focus();
    }
}

/**
 * Base class for Characters and NPCs.
 */
class Fighter {
    constructor(name, dex, hp, san, cons, pow, str, size, spells, magic) {
        this.name = name;
        this.dex = parseInt(dex) || 0;
        this.hp = parseInt(hp) || 0;
        this.san = parseInt(san) || 0;
        this.cons = parseInt(cons) || 0;
        this.pow = parseInt(pow) || 0;
        this.str = parseInt(str) || 0;
        this.size = parseInt(size) || 0;
        this.spells = spells || [];
        this.magic = parseInt(magic) || 0;
    }

    getType() {
        return this.constructor.name;
    }
}

/**
 * Manages player characters (Investigators).
 */
class Character extends Fighter {
    constructor(name, dex, hp, san, cons, pow, str, size, spells, magic) {
        super(name, dex, hp, san, cons, pow, str, size, spells, magic);
        this.type = 'Character';
    }

    static characters = [];
    static filePath = "characters.json";
    static mainContent = null;

    static cloneCharacter(char) {
        return new Character(char.name, char.dex, char.hp, char.san, char.cons, char.pow, char.str, char.size, [...char.spells], char.magic);
    }

    static load() {
        const raw = loadData(Character.filePath);
        Character.characters = raw.map(c => new Character(c.name, c.dex, c.hp, c.san, c.cons, c.pow, c.str, c.size, c.spells, c.magic));
    }

    static save() {
        saveData(Character.filePath, Character.characters);
    }

    static characterMenu() {
        Character.mainContent.innerHTML = '';
        const heading = createElement('h2', 'Investigator Manager');
        Character.mainContent.appendChild(heading);
        const ul = createElement('ul', null, 'menu-list');
        const menuItems = [
            { text: "View All Investigators", action: Character.listCharacters },
            { text: "Add New Investigator", action: Character.renderNewCharacterForm },
            { text: "Back to Main Menu", action: mainMenu }
        ];
        menuItems.forEach(item => {
            const li = createElement('li');
            li.appendChild(createElement('button', item.text, 'btn', item.action));
            ul.appendChild(li);
        });
        Character.mainContent.appendChild(ul);
    }

    static listCharacters() {
        Character.mainContent.innerHTML = '';
        const heading = createElement('h3', 'Registered Investigators');
        Character.mainContent.appendChild(heading);

        if (Character.characters.length === 0) {
            Character.mainContent.appendChild(createElement('p', 'No investigators in the database.'));
        } else {
            Character.characters.sort((a, b) => a.name.localeCompare(b.name));
            const ul = createElement('ul', null, 'character-list');
            Character.characters.forEach((item, i) => {
                const li = createElement('li');
                li.innerHTML = `
                    <div style="flex-grow: 1;">
                        <span style="font-weight: bold; font-size: 1.1em;">${item.name}</span><br>
                        <small>DEX: ${item.dex} | SAN: ${item.san} | HP: ${item.hp}</small>
                    </div>
                    <div class="char-actions">
                        <button class="btn" onclick="Character.displayCharacter(${i})">View</button>
                        <button class="btn btn-secondary" onclick="Character.renderEditForm(${i})">Edit</button>
                    </div>`;
                ul.appendChild(li);
            });
            Character.mainContent.appendChild(ul);
        }
        Character.mainContent.appendChild(createElement('button', '← Back to Investigator Menu', 'btn', Character.characterMenu));
    }

    static displayCharacter(index) {
        const item = Character.characters[index];
        Character.mainContent.innerHTML = `
            <h3>Stats for ${item.name}</h3>
            <div class="character-details">
                <p><strong>DEX (Dexterity):</strong> ${item.dex}</p>
                <p><strong>STR (Strength):</strong> ${item.str}</p>
                <p><strong>CON (Constitution):</strong> ${item.cons}</p>
                <p><strong>SIZ (Size):</strong> ${item.size}</p>
                <p><strong>POW (Power):</strong> ${item.pow}</p>
                <hr>
                <p><strong>HP (Hit Points):</strong> ${item.hp}</p>
                <p><strong>SAN (Sanity):</strong> ${item.san}</p>
                <p><strong>Magic Points (MP):</strong> ${item.magic}</p>
            </div>
        `;
        Character.mainContent.appendChild(createElement('button', '← Back to List', 'btn', Character.listCharacters));
    }

    static renderNewCharacterForm() {
        Character.renderEditForm(-1); // Use -1 to signify a new character
    }

    static renderEditForm(index) {
        const isNew = index === -1;
        const character = isNew ? {} : Character.characters[index];
        const title = isNew ? 'Create New Investigator' : `Edit ${character.name}`;

        Character.mainContent.innerHTML = '';
        const form = createElement('form', null, 'character-form');
        form.onsubmit = (e) => { e.preventDefault(); Character.handleCharacterForm(form, index); };

        const fields = [
            { name: 'name', label: "Name", type: 'text', required: true },
            { name: 'dex', label: "DEX", type: 'number', required: true, value: 50 },
            { name: 'str', label: "STR", type: 'number', required: true, value: 50 },
            { name: 'cons', label: "CON", type: 'number', required: true, value: 50 },
            { name: 'size', label: "SIZ", type: 'number', required: true, value: 50 },
            { name: 'pow', label: "POW", type: 'number', required: true, value: 50 },
            { name: 'san', label: "Current SAN", type: 'number', required: true, value: 50 },
            { name: 'hp', label: "Current HP", type: 'number', required: false },
            { name: 'magic', label: "Current MP", type: 'number', required: false }
        ];

        fields.forEach(field => {
            const label = createElement('label', field.label);
            const input = document.createElement('input');
            input.type = field.type;
            input.id = input.name = field.name;
            if(field.type === 'number') {
                input.min = 0;
                input.max = 200; // Allow higher values for HP etc.
            }
            input.required = field.required;
            input.value = isNew ? field.value || '' : character[field.name];

            const div = createElement('div', null, 'form-group');
            div.append(label, input);
            form.appendChild(div);
        });

        form.appendChild(createElement('button', isNew ? 'Create Investigator' : 'Save Changes', 'btn', null));
        Character.mainContent.appendChild(createElement('h3', title));
        Character.mainContent.appendChild(form);
        Character.mainContent.appendChild(createElement('button', '← Cancel', 'btn btn-secondary', Character.characterMenu));
        document.getElementById('name').focus();
    }

    static handleCharacterForm(form, index) {
        const isNew = index === -1;
        const data = new FormData(form);

        const name = data.get('name').trim();
        const dex = validateNumber(data.get('dex'), 100);
        const str = validateNumber(data.get('str'), 100);
        const cons = validateNumber(data.get('cons'), 100);
        const size = validateNumber(data.get('size'), 100);
        const pow = validateNumber(data.get('pow'), 100);

        // Derived stats are calculated on creation, but can be manually set/edited
        let hp = validateNumber(data.get('hp'));
        let san = validateNumber(data.get('san'));
        let magic = validateNumber(data.get('magic'));

        if (isNew) {
            hp = hp || Math.floor((cons + size) / 10);
            magic = magic || Math.floor(pow / 5);
        }

        const characterData = { name, dex, hp, san, cons, pow, str, size, spells: isNew ? [] : Character.characters[index].spells, magic };

        if (isNew) {
            const character = new Character(...Object.values(characterData));
            Character.characters.push(character);
        } else {
            Object.assign(Character.characters[index], characterData);
        }

        Character.save();
        alert(`Investigator "${name}" has been ${isNew ? 'added' : 'updated'}!`);
        Character.listCharacters();
    }
}

/**
 * Manages Non-Player Characters.
 */
class NPC extends Fighter {
     constructor(name, fight, dex, str, size, cons, dodge, hp, magic, san, pow, spells, weapons) {
        super(name, dex, hp, san, cons, pow, str, size, spells, magic);
        this.fight = parseInt(fight) || 0;
        this.dodge = parseInt(dodge) || 0;
        this.weapons = weapons || [];
        this.type = 'NPC';
    }

    static npcs = [];
    static filePath = "npcs.json";
    static mainContent = null;

    static cloneNPC(npc) {
        return new NPC(npc.name, npc.fight, npc.dex, npc.str, npc.size, npc.cons, npc.dodge, npc.hp, npc.magic, npc.san, npc.pow, [...npc.spells], [...npc.weapons]);
    }

    static load() {
        const raw = loadData(NPC.filePath);
        NPC.npcs = raw.map(n => new NPC(n.name, n.fight, n.dex, n.str, n.size, n.cons, n.dodge, n.hp, n.magic, n.san, n.pow, n.spells, n.weapons));
    }

    static save() {
        saveData(NPC.filePath, NPC.npcs);
    }

    static npcMenu() {
        NPC.mainContent.innerHTML = '';
        const heading = createElement('h2', 'NPC Manager');
        NPC.mainContent.appendChild(heading);
        const ul = createElement('ul', null, 'menu-list');
        const menuItems = [
            { text: "View All NPCs", action: NPC.listNPCs },
            { text: "Add New NPC", action: () => NPC.renderEditForm(-1) },
            { text: "Back to Main Menu", action: mainMenu }
        ];
        menuItems.forEach(item => {
            ul.appendChild(createElement('li')).appendChild(createElement('button', item.text, 'btn', item.action));
        });
        NPC.mainContent.appendChild(ul);
    }

     static listNPCs() {
        NPC.mainContent.innerHTML = '';
        const heading = createElement('h3', 'Registered NPCs');
        NPC.mainContent.appendChild(heading);

        if (NPC.npcs.length === 0) {
            NPC.mainContent.appendChild(createElement('p', 'No NPCs in the database.'));
        } else {
            NPC.npcs.sort((a, b) => a.name.localeCompare(b.name));
            const ul = createElement('ul', null, 'character-list');
            NPC.npcs.forEach((item, i) => {
                const li = createElement('li');
                li.innerHTML = `
                     <div style="flex-grow: 1;">
                        <span style="font-weight: bold; font-size: 1.1em;">${item.name}</span><br>
                        <small>FIGHT: ${item.fight} | DEX: ${item.dex} | HP: ${item.hp}</small>
                    </div>
                    <div class="npc-actions">
                         <button class="btn" onclick="NPC.displayNPC(${i})">View</button>
                         <button class="btn btn-secondary" onclick="NPC.renderEditForm(${i})">Edit</button>
                    </div>`;
                ul.appendChild(li);
            });
            NPC.mainContent.appendChild(ul);
        }
        NPC.mainContent.appendChild(createElement('button', '← Back to NPC Menu', 'btn', NPC.npcMenu));
    }

    static displayNPC(index) {
        const item = NPC.npcs[index];
        NPC.mainContent.innerHTML = `
            <h3>Stats for ${item.name}</h3>
            <div class="character-details">
                <p><strong>Fight:</strong> ${item.fight}</p>
                <p><strong>Dodge:</strong> ${item.dodge}</p>
                <p><strong>DEX:</strong> ${item.dex} | <strong>STR:</strong> ${item.str} | <strong>CON:</strong> ${item.cons} | <strong>SIZ:</strong> ${item.size} | <strong>POW:</strong> ${item.pow}</p>
                 <hr>
                <p><strong>HP:</strong> ${item.hp} | <strong>SAN:</strong> ${item.san} | <strong>MP:</strong> ${item.magic}</p>
                <p><strong>Damage Bonus:</strong> ${NPC.NPCBonus(item)} | <strong>Build:</strong> ${NPC.NPCBuild(item)}</p>
            </div>`;
        NPC.mainContent.appendChild(createElement('button', '← Back to List', 'btn', NPC.listNPCs));
    }

    static renderEditForm(index) {
        const isNew = index === -1;
        const npc = isNew ? {} : NPC.npcs[index];
        const title = isNew ? 'Create New NPC' : `Edit ${npc.name}`;

        NPC.mainContent.innerHTML = '';
        const form = createElement('form', null, 'npc-form');
        form.onsubmit = (e) => { e.preventDefault(); NPC.handleNPCForm(form, index); };

        const fields = [
            { name: 'name', label: "Name", type: 'text', required: true },
            { name: 'fight', label: "Fight Skill", type: 'number', value: 50 },
            { name: 'dex', label: "DEX", type: 'number', value: 50 },
            { name: 'str', label: "STR", type: 'number', value: 50 },
            { name: 'size', label: "SIZ", type: 'number', value: 50 },
            { name: 'cons', label: "CON", type: 'number', value: 50 },
            { name: 'dodge', label: "Dodge Skill", type: 'number', value: 50 },
            { name: 'pow', label: "POW", type: 'number', value: 50 }
        ];

        fields.forEach(field => {
             const div = createElement('div', null, 'form-group');
             const label = createElement('label', field.label);
             const input = document.createElement('input');
             input.type = input.name = input.id = field.name;
             input.min = 0; input.max = 200;
             input.value = isNew ? field.value || '' : npc[field.name];
             div.append(label, input);
             form.appendChild(div);
        });

        form.appendChild(createElement('button', isNew ? 'Create NPC' : 'Save Changes', 'btn'));
        NPC.mainContent.appendChild(createElement('h3', title));
        NPC.mainContent.appendChild(form);
        NPC.mainContent.appendChild(createElement('button', '← Cancel', 'btn btn-secondary', NPC.npcMenu));
        document.getElementById('name').focus();
    }

    static handleNPCForm(form, index) {
        const isNew = index === -1;
        const data = new FormData(form);
        const name = data.get('name').trim();
        const fight = validateNumber(data.get('fight'));
        const dex = validateNumber(data.get('dex'));
        const str = validateNumber(data.get('str'));
        const size = validateNumber(data.get('size'));
        const cons = validateNumber(data.get('cons'));
        const dodge = validateNumber(data.get('dodge'));
        const pow = validateNumber(data.get('pow'));

        // Derived stats are always calculated
        const hp = Math.floor((cons + size) / 10);
        const san = pow;
        const magic = Math.floor(pow / 5);

        const npcData = { name, fight, dex, str, size, cons, dodge, hp, magic, san, pow, spells: [], weapons: [] };

        if (isNew) {
            const npc = new NPC(...Object.values(npcData));
            NPC.npcs.push(npc);
        } else {
            Object.assign(NPC.npcs[index], npcData);
        }

        NPC.save();
        alert(`NPC "${name}" has been ${isNew ? 'created' : 'updated'}!`);
        NPC.listNPCs();
    }

    static NPCBonus(npc) {
        const raw = npc.str + npc.size;
        if (raw <= 64) return '-2';
        if (raw <= 84) return '-1';
        if (raw <= 124) return '0';
        if (raw <= 164) return '+1D4';
        return '+1D6';
    }

    static NPCBuild(npc) {
        const raw = npc.str + npc.size;
        if (raw <= 64) return -2;
        if (raw <= 84) return -1;
        if (raw <= 124) return 0;
        if (raw <= 164) return 1;
        return 2;
    }
}

/**
 * Manages combat encounters.
 */
class Combat {
     constructor(name, fighters = []) {
        this.name = name;
        this.fighters = fighters;
    }

    static combats = [];
    static localStorageKey = "coc_combats_db";
    static mainContent = null;
    
    // Combat instance state
    static activeCombat = {
        name: '',
        fighters: [],
        turn: 0,
        round: 1
    };

    static load() {
        const raw = loadData(Combat.localStorageKey);
        Combat.combats = raw.map(c => new Combat(c.name, c.fighters));
    }

    static save() {
        saveData(Combat.localStorageKey, Combat.combats);
    }
    
    static renderCombatMenu() {
        Combat.mainContent.innerHTML = '<h2>Combat Manager</h2>';
        const ul = createElement('ul', null, 'menu-list');
        const menuItems = [
            { text: "View Saved Combats", action: Combat.listCombats },
            { text: "Create New Combat", action: Combat.renderNewCombatForm },
            { text: "Back to Main Menu", action: mainMenu }
        ];
         menuItems.forEach(item => {
            ul.appendChild(createElement('li')).appendChild(createElement('button', item.text, 'btn', item.action));
        });
        Combat.mainContent.appendChild(ul);
    }
    
    static listCombats() {
        Combat.mainContent.innerHTML = '<h2>Saved Combats</h2>';
        
        if (Combat.combats.length === 0) {
            Combat.mainContent.appendChild(createElement('p', 'No combats saved. Create one to begin!'));
        } else {
            const ul = createElement('ul', null, 'character-list');
            Combat.combats.forEach((combat, index) => {
                const li = createElement('li');
                li.innerHTML = `
                    <div style="flex-grow: 1;">
                        <span style="font-weight: bold; font-size: 1.1em;">${combat.name}</span><br>
                        <small>${combat.fighters.length} fighters</small>
                    </div>
                    <div>
                        <button class="btn" onclick="Combat.startCombat(${index})">Run</button>
                        <button class="btn btn-delete" onclick="Combat.deleteCombat(${index})">Delete</button>
                    </div>
                `;
                ul.appendChild(li);
            });
            Combat.mainContent.appendChild(ul);
        }
        
        const controls = createElement('div', null, 'combat-controls');
        controls.appendChild(createElement('button', '← Back to Combat Menu', 'btn', Combat.renderCombatMenu));
        Combat.mainContent.appendChild(controls);
    }
    
    static renderNewCombatForm() {
        Combat.mainContent.innerHTML = '<h2>Create New Combat</h2>';
        const form = createElement('form');
        form.onsubmit = e => { e.preventDefault(); Combat.handleNewCombatForm(form); };

        form.innerHTML = `
            <label for="combat-name">Combat Name:</label>
            <input type="text" id="combat-name" name="name" required>
            
            <h3>Select Fighters</h3>
            <h4>Investigators</h4>
            <div id="char-list"></div>
            <h4>NPCs</h4>
            <div id="npc-list"></div>
            
            <button type="submit" class="btn">Create Combat</button>
        `;
        
        const charList = form.querySelector('#char-list');
        Character.characters.forEach((char, index) => {
            charList.innerHTML += `<div><input type="checkbox" id="c${index}" value="char-${index}"><label for="c${index}"> ${char.name}</label></div>`;
        });

        const npcList = form.querySelector('#npc-list');
        NPC.npcs.forEach((npc, index) => {
            npcList.innerHTML += `<div><input type="checkbox" id="n${index}" value="npc-${index}"><label for="n${index}"> ${npc.name}</label></div>`;
        });

        Combat.mainContent.appendChild(form);
        Combat.mainContent.appendChild(createElement('button', '← Cancel', 'btn btn-secondary', Combat.renderCombatMenu));
    }
    
    static handleNewCombatForm(form) {
        const formData = new FormData(form);
        const name = formData.get('name').trim();
        const selectedFighters = [];
        
        form.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            const [type, indexStr] = checkbox.value.split('-');
            const index = parseInt(indexStr);
            if (type === 'char') {
                selectedFighters.push(Character.characters[index]);
            } else if (type === 'npc') {
                selectedFighters.push(NPC.npcs[index]);
            }
        });

        if (!name || selectedFighters.length === 0) {
            alert("Please provide a name and select at least one fighter.");
            return;
        }

        const newCombat = new Combat(name, selectedFighters);
        Combat.combats.push(newCombat);
        Combat.save();
        alert(`Combat "${name}" created!`);
        Combat.listCombats();
    }
    
    static deleteCombat(index) {
        if (loopControl(`Are you sure you want to delete "${Combat.combats[index].name}"?`)) {
            Combat.combats.splice(index, 1);
            Combat.save();
            Combat.listCombats();
        }
    }
    
    static startCombat(index) {
        const sourceCombat = Combat.combats[index];
        Combat.activeCombat.name = sourceCombat.name;
        // Deep clone fighters for the combat instance
        Combat.activeCombat.fighters = sourceCombat.fighters.map(f => f.type === 'Character' ? Character.cloneCharacter(f) : NPC.cloneNPC(f));
        Combat.activeCombat.fighters.sort((a, b) => b.dex - a.dex);
        Combat.activeCombat.turn = 0;
        Combat.activeCombat.round = 1;

        Combat.renderCombatTurn();
    }
    
    static renderCombatTurn() {
        MAIN_CONTENT.innerHTML = `
            <h2>${Combat.activeCombat.name} - Round ${Combat.activeCombat.round}</h2>
            <div id="combat-tracker"></div>
            <div class="combat-controls"></div>
        `;

        const tracker = MAIN_CONTENT.querySelector('#combat-tracker');
        const controls = MAIN_CONTENT.querySelector('.combat-controls');

        Combat.activeCombat.fighters.forEach((fighter, index) => {
            const card = createElement('div', null, 'fighter-card');
            if (index === Combat.activeCombat.turn) {
                card.classList.add('active-fighter');
            }
            card.innerHTML = `
                <h4>${fighter.name} <small>(${fighter.type})</small></h4>
                <p><strong>HP:</strong> ${fighter.hp} | <strong>SAN:</strong> ${fighter.san} | <strong>MP:</strong> ${fighter.magic}</p>
                <p><strong>DEX:</strong> ${fighter.dex}</p>
                <div class="actions"></div>
            `;
            tracker.appendChild(card);

            if (index === Combat.activeCombat.turn) {
                const actions = card.querySelector('.actions');
                actions.appendChild(createElement('button', 'Attack', 'btn', () => Combat.renderAttackUI()));
                actions.appendChild(createElement('button', 'End Turn', 'btn btn-secondary', () => Combat.endTurn()));
            }
        });
        
        controls.appendChild(createElement('button', 'End Combat', 'btn btn-delete', () => {
             if(confirm('Are you sure you want to end this combat? Progress will be lost.')) Combat.renderCombatMenu();
        }));
    }
    
    static endTurn() {
        Combat.activeCombat.turn++;
        if (Combat.activeCombat.turn >= Combat.activeCombat.fighters.length) {
            Combat.activeCombat.turn = 0;
            Combat.activeCombat.round++;
        }
        Combat.renderCombatTurn();
    }

    static renderAttackUI() {
        Combat.renderCombatTurn(); // Re-render to clear old state
        const tracker = MAIN_CONTENT.querySelector('#combat-tracker');
        tracker.querySelectorAll('.fighter-card').forEach((card, index) => {
            if (index !== Combat.activeCombat.turn) {
                card.classList.add('targetable');
                card.onclick = () => Combat.selectTargetForAttack(index);
            }
        });
        MAIN_CONTENT.querySelector('.active-fighter .actions').innerHTML = '<p><strong>Select a target...</strong></p>';
    }
    
    static selectTargetForAttack(targetIndex) {
        const damage = prompt(`Enter damage amount for ${Combat.activeCombat.fighters[targetIndex].name}:`);
        if (damage === null || damage.trim() === '') return;
        
        const amount = validateNumber(damage);
        const target = Combat.activeCombat.fighters[targetIndex];
        target.hp -= amount;

        alert(`${target.name} takes ${amount} damage! New HP: ${target.hp}`);

        if (target.hp <= 0) {
            alert(`${target.name} has been defeated!`);
            Combat.activeCombat.fighters.splice(targetIndex, 1);
            // Adjust turn if the removed fighter was before the current one
            if (targetIndex < Combat.activeCombat.turn) {
                Combat.activeCombat.turn--;
            }
        }
        
        Combat.endTurn();
    }
}

// ===================================================
// APP STARTUP
// ===================================================

// Expose classes to the global window object for onclick handlers
window.mainMenu = mainMenu;
window.Character = Character;
window.NPC = NPC;
window.Spell = Spell;
window.Weapon = Weapon;
window.Combat = Combat;

// Start the app once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', initApp);
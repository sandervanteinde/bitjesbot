/**
 * @readonly
 * @enum {string}
 */
const Role = require('./role');
const Faction = require('./faction');
module.exports = [
    new Role(Faction.Fascist, true),
    new Role(Faction.Liberal),
    new Role(Faction.Liberal),
    new Role(Faction.Liberal),
    new Role(Faction.Fascist),
    new Role(Faction.Liberal),
    new Role(Faction.Fascist),
    new Role(Faction.Liberal),
    new Role(Faction.Fascist),
    new Role(Faction.Liberal)
];


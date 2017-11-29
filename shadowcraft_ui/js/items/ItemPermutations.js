import { getTOSItems } from './TOSItems';

// we can just register the different definitions here (the multiple TOS entrys are just an example, they would all be different)
// we can also impliment any caching or local storage stategies here
export function getItems(slot = 'head', min = 0, max = 10000) {
    return [
        ...getTOSItems(slot, parseInt(min), parseInt(max)), // important to spread into this array, not just assign
    ];
} 

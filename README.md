# scratch-new-api

scratch-new-api (TBD name) is a work-in-progress library for interfacing with the Scratch API and website. Inspired by trumank's [scratch-api](https://github.com/trumank/scratch-api) and spawning from [my](https://github.com/towerofnix/scratch-api-unofficial-docs/) [previous](https://github.com/towerofnix/scratch-client-omg) [projects](https://git.ed1.club/florrie/scratchrlol.git/) related to the Scratch API, scratch-new-api makes use of modern, documented, unit-tested code to provide a reliable interface to Scratch.

**Disclaimer: This library is a WIP. Its API isn't yet finalized.** There is likely still active development going on, and functions and classes may still be modified in breaking ways.

## Examples

```js
const scratch = new Scratch();
const user = scratch.getUser({username: 'griffpatch'});
for await (const { username } of user.getFollowers()) {
    console.log(username);
    // Artificial delay: don't make hundreds of fetches all at once! :)
    await delay(250);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```

```js
const scratch = new Scratch();
const user = scratch.getUser({username: 'griffpatch'});
for await (const projectData of user.getSharedProjects()) {
    const project = scratch.getProject(projectData);
    const title = await project.getTitle();
    const stats = await project.getStats();
    console.log(`${title}: ${stats.loves} love-its, ${stats.views} views`);
    await delay(250);
}
```

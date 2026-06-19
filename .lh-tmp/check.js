const {PrismaClient} = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  const u = await p.user.findUnique({
    where: { username: 'parent.arya' },
    include: { playersLink: true },
  });
  console.log(JSON.stringify({
    user: u?.username,
    playersLink: u?.playersLink?.length ?? 0,
    players: u?.playersLink?.map((x) => x.playerId),
  }, null, 2));
  await p.$disconnect();
})();

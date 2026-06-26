import { prisma } from "../lib/prisma";


async function main() {
    await prisma.category.createMany({
        data: [
            { name: "Technology" },
            { name: "Programming" },
            { name: "Education" },
            { name: "Lifestyle" },
            { name: "Business" },
            { name: "Health" },
        ],
        skipDuplicates: true,
    });

    console.log("Categories seeded successfully.");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

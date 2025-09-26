import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Criar projetos de exemplo
  const workProject = await prisma.project.upsert({
    where: { name: 'Trabalho' },
    update: {},
    create: {
      name: 'Trabalho',
    },
  });

  const personalProject = await prisma.project.upsert({
    where: { name: 'Pessoal' },
    update: {},
    create: {
      name: 'Pessoal',
    },
  });

  // Criar tags de exemplo
  const urgentTag = await prisma.tag.upsert({
    where: { name: 'Urgente' },
    update: {},
    create: {
      name: 'Urgente',
      color: '#FF5733',
    },
  });

  const personalTag = await prisma.tag.upsert({
    where: { name: 'Pessoal' },
    update: {},
    create: {
      name: 'Pessoal',
      color: '#33FF57',
    },
  });

  // Criar tarefas de exemplo
  const task1 = await prisma.task.create({
    data: {
      content: 'Completar relatório mensal',
      projectId: workProject.id,
      projectColor: '#FF5733',
      tags: {
        connect: { id: urgentTag.id }
      }
    },
  });

  const task2 = await prisma.task.create({
    data: {
      content: 'Comprar mantimentos',
      projectId: personalProject.id,
      projectColor: '#33FF57',
      tags: {
        connect: { id: personalTag.id }
      }
    },
  });

  const task3 = await prisma.task.create({
    data: {
      content: 'Agendar consulta médica',
      completed: true,
      projectId: personalProject.id,
      projectColor: '#33FF57',
      tags: {
        connect: { id: personalTag.id }
      }
    },
  });

  console.log('Dados de exemplo adicionados com sucesso!');
  console.log(`Criados: ${workProject.name}, ${personalProject.name}`);
  console.log(`Tags: ${urgentTag.name}, ${personalTag.name}`);
  console.log(`Tarefas: ${task1.id}, ${task2.id}, ${task3.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import db from '../config/db.js';

const quoteIdentifier = (value) => `\`${String(value).replaceAll('`', '``')}\``;

const getUniqueIndexes = async () => {
  const [indexes] = await db.query(`
    SELECT
      TABLE_NAME AS tableName,
      INDEX_NAME AS indexName,
      GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columnsList
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      TABLE_SCHEMA = DATABASE()
      AND NON_UNIQUE = 0
      AND INDEX_NAME <> 'PRIMARY'
    GROUP BY TABLE_NAME, INDEX_NAME
    ORDER BY TABLE_NAME, columnsList, INDEX_NAME
  `);

  return indexes;
};

const cleanupDuplicateIndexes = async () => {
  const indexes = await getUniqueIndexes();
  const grouped = new Map();

  for (const index of indexes) {
    const key = `${index.tableName}:${index.columnsList}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key).push(index);
  }

  const duplicates = [...grouped.values()]
    .filter((group) => group.length > 1)
    .flatMap((group) => group.slice(1));

  if (duplicates.length === 0) {
    console.log('No hay indices UNIQUE duplicados.');
    return;
  }

  for (const duplicate of duplicates) {
    const tableName = quoteIdentifier(duplicate.tableName);
    const indexName = quoteIdentifier(duplicate.indexName);

    console.log(
      `Eliminando indice duplicado ${duplicate.indexName} en ${duplicate.tableName}(${duplicate.columnsList})`
    );

    await db.query(`ALTER TABLE ${tableName} DROP INDEX ${indexName}`);
  }

  console.log(`Listo. Se eliminaron ${duplicates.length} indices UNIQUE duplicados.`);
};

try {
  await db.authenticate();
  await cleanupDuplicateIndexes();
} catch (error) {
  console.error('Error limpiando indices duplicados:');
  console.error(error);
  process.exitCode = 1;
} finally {
  await db.close();
}

const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

// Route pour récupérer tous les articles
router.get('/', async (req, res) => {
  const sql = 'SELECT * FROM articles';
  try {
    const [results] = await req.db.execute(sql);
    res.json(results);
  } catch (err) {
    console.error('Erreur lors de la récupération des articles :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des articles' });
  }
});

// Route pour chercher un article par titre
router.post('/search', async (req, res) => {
  console.log(
    'req.body:', req.body,
  );

  const { title } = req.body;
  const sql = `SELECT * FROM articles WHERE title LIKE '%${title}%'`;
  console.log(sql);

  try {
    const [results] = await req.db.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Erreur lors de la recherche des articles :', err);
    res.status(500).json({ error: 'Erreur lors de la recherche des articles' });
  }
});

// Route pour récupérer un article spécifique
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM articles WHERE id = ?';
  try {
    const [results] = await req.db.execute(sql, [id]);
    if (results.length === 0) {
      res.status(404).json({ error: 'Article introuvable' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error('Erreur lors de la récupération de l\'article :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'article' });
  }
});

// Route pour créer un nouvel article
router.post('/', authenticate, async (req, res) => {
  const { title, content } = req.body;
  const sql = 'INSERT INTO articles (title, content, author_id) VALUES (?, ?, ?)';
  const author_id = req.user_id;

  try {
    const [results] = await req.db.execute(sql, [title, content, author_id]);
    const newArticle = {
      id: results.insertId,
      title,
      content,
      author_id
    };
    res.status(201).json({ message: 'Article créé avec succès', article: newArticle });
  } catch (err) {
    console.error('Erreur lors de la création de l\'article :', err);
    res.status(500).json({ error: 'Erreur lors de la création de l\'article' });
  }
});

// Route pour modifier un article
router.put('/:id', authenticate, async (req, res) => {
    const articleId = req.params.id;
    const { title, content } = req.body;

    try {
        const [rows] = await req.db.execute(
            'SELECT author_id FROM articles WHERE id = ?',
            [articleId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Article introuvable' });
        }

        const article = rows[0];

        if (article.author_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Vous n’êtes pas autorisé à modifier cet article'
            });
        }

        const [result] = await req.db.execute(
            'UPDATE articles SET title = ?, content = ? WHERE id = ?',
            [title, content, articleId]
        );

        res.json({
            message: 'Article modifié avec succès',
            article: {
                id: articleId,
                title,
                content,
                author_id: article.author_id
            }
        });
    } catch (err) {
        console.error('Erreur lors de la modification de l\'article :', err);
        res.status(500).json({ error: 'Erreur lors de la modification de l\'article' });
    }
});

// Route pour supprimer un article
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM articles WHERE id = ?';
  try {
    const [results] = await req.db.execute(sql, [id]);
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Article introuvable' });
    }
    res.json({ message: 'Article supprimé avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression de l\'article :', err);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'article' });
  }
});

module.exports = router;

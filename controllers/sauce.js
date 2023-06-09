const Sauce = require('../models/sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
      ...sauceObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  sauce.save()
  .then(() => { res.status(201).json({message: 'Sauce enregistré !'})})
  .catch(error => { res.status(400).json( { error })})
    console.log('Sauce non enregistré')
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ? {
      ...JSON.parse(req.body.sauce),
      
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete sauceObject._userId;
  if (req.file) {
    Sauce.findOne({ _id: req.params.id })
      .then((sauce) => {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          
          Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id }) 
            .then(() => res.status(200).json({ message: 'Sauce et image modifiées' }))
            .catch((error) => res.status(400).json({ error }));
        });
      })
      .catch((error) => res.status(400).json({ error }));
  } else {
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id }) 
      .then(() => res.status(200).json({ message: 'Sauce modifiée' }))
      .catch((error) => res.status(400).json({ error }));
  }

};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id})
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({message: 'Not authorized'});
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                sauce.deleteOne({_id: req.params.id})
                    .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                    .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
 };

exports.getAllSauce = (req, res, next) => {
    Sauce.find()
      .then(sauces => res.status(200).json(sauces))
      .catch(error => res.status(400).json({ error }));
}

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => res.status(200).json(sauce))
      .catch(error => res.status(404).json({ error }));
}

exports.postLike = (req, res, next) => {
    const like = req.body.like;
    const userId = req.body.userId;
    Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (like === 0){
        sauce.usersLiked.filter( userId => userId =! req.body.userId)
        sauce.usersDisliked.filter( userId => userId =! req.body.userId)

      }else if(like === 1){
        sauce.usersDisliked.filter( userId => userId =! req.body.userId)
        if(!sauce.usersLiked.find(userId => userId == req.body.userId)){
          sauce.usersLiked.push(req.body.userId)
        }
      }else if (like === -1){
        console.log(like);
        sauce.usersLiked.filter( userId => userId =! req.body.userId)
        if(!sauce.usersDisliked.find(userId => userId == req.body.userId)){
          sauce.usersDisliked.push(req.body.userId)
        }
      }
      sauce.likes = sauce.usersLiked.length
      sauce.dislikes = sauce.usersDisliked.length

      sauce.save()
    })
    .then(() => res.status(200).json({ message: 'Like ajouté' }))
    .catch((error) => res.status(400).json({ error }));
    /*if (like === 0) {
      Sauce.findOne({ _id: req.params.id }) 
        .then((sauce) => {
          if (sauce.usersLiked.includes(req.body.userId)) {
            sauce.updateOne(
              { _id: req.params.id },
              {
                $pull: { usersLiked: req.body.userId },
                $inc: { likes: -1 },
                _id: req.params.id,
              }
            )
              .then(() => res.status(200).json({ message: 'Like retiré' }))
              .catch((error) => res.status(400).json({ error }));
          }
          if (sauce.usersDisliked.includes(req.body.userId)) {
            sauce.updateOne(
              { _id: req.params.id },
              {
                $pull: { usersDisliked: req.body.userId }, 
                $inc: { dislikes: -1 }, 
                _id: req.params.id,
              }
            )
              .then(() => res.status(200).json({ message: 'Dislike retiré' }))
              .catch((error) => res.status(400).json({ error }));
          } else {
            () => res.status(200).json({ message: 'Merci de nous donner votre avis' });
          }
        })
        .catch((error) => res.status(404).json({ error }));
    }
  
    if (like === 1) {
      Sauce.updateOne(
        { _id: req.params.id },
        {
          $push: { usersLiked: userId }, 
          $inc: { likes: 1 }, 
        }
      )
        .then(() => res.status(200).json({ message: 'Like ajouté' }))
        .catch((error) => res.status(400).json({ error }));
    }
  
    if (like === -1) {
      Sauce.updateOne(
        { _id: req.params.id },
        {
          $push: { usersDisliked: userId },
          $inc: { dislikes: 1 },
        }
      )
        .then(() => res.status(200).json({ message: 'Dislike ajouté' }))
        .catch((error) => res.status(400).json({ error }));
    }*/
};
  
# PokemonSpriteEditor

## MongoDB Setup

This project uses MongoDB for storing projects and user accounts. To enable database features you need to provide a connection string.

1. Create a MongoDB database using [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or a local MongoDB server.
2. Copy the connection URI, for example:
   `mongodb+srv://<user>:<password>@cluster0.mongodb.net/<database>?retryWrites=true&w=majority`
3. Create a `.env.local` file in the project root and add:
   `MONGODB_URI=your-connection-string`
4. Restart the development server with `npm run dev`.

If the connection string is missing you will see `MONGODB_URI is not defined` and database features will be disabled.


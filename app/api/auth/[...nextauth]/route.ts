import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "../../../../lib/supabase"; 

// 1. Definimos las opciones por separado
//
// El proveedor de Google solo se agrega si las credenciales existen de
// verdad. Antes se registraba siempre (con string vacío como relleno), lo
// que dejaba el botón "Iniciar sesión con Google" visible y roto en el
// login mientras GOOGLE_CLIENT_ID/SECRET no estuvieran configuradas.
export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Correo y Contraseña",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) {
          throw new Error("Credenciales incorrectas");
        }

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || (data.user.email ? data.user.email.split('@')[0] : 'Usuario'), 
        };
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt" as const,
  }
};

// 2. Creamos el manejador (handler)
const handler = NextAuth(authOptions);

// 3. Exportación MODERNA obligatoria para App Router
export { handler as GET, handler as POST };

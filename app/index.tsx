import { FontAwesome } from "@expo/vector-icons";
import { Link, useFocusEffect } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Avatar from "../components/Avatar";
import { Event, getUpcomingEvents } from "../firebase/events";
import { auth } from "../firebaseConfig";

// Marges et espacement utilisés pour calculer la largeur des cartes.
const CONTAINER_PADDING = 24;
const GRID_GAP = 12;

function formatEventDate(timestamp: Timestamp) {
   return timestamp.toDate().toLocaleString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
   });
}

export default function HomePage() {
   const [events, setEvents] = useState<Event[]>([]);
   const [loading, setLoading] = useState(true);
   const [user, setUser] = useState<User | null>(null);
   const [authReady, setAuthReady] = useState(false);

   // Grille responsive : 4 cartes/ligne sur desktop, 2 sur tablette, 1 sur mobile.
   const { width } = useWindowDimensions();
   const numColumns = width >= 1024 ? 4 : width >= 700 ? 2 : 1;
   const cardWidth = Math.floor(
      (width - CONTAINER_PADDING * 2 - GRID_GAP * (numColumns - 1)) /
         numColumns,
   );

   const loadEvents = useCallback(async () => {
      setLoading(true);
      try {
         const data = await getUpcomingEvents();
         setEvents(data);
      } catch {
         // La lecture est refusée si l'utilisateur n'est pas connecté.
         setEvents([]);
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
         setUser(u);
         setAuthReady(true);
      });
      return unsubscribe;
   }, []);

   // Premier chargement dès que l'utilisateur connecté est connu.
   useEffect(() => {
      if (user) loadEvents();
   }, [user, loadEvents]);

   // Recharge la liste quand l'écran reprend le focus (ex: retour de création).
   useFocusEffect(
      useCallback(() => {
         if (auth.currentUser) loadEvents();
      }, [loadEvents]),
   );

   // La lecture des événements exige d'être connecté (règles Firestore).
   if (authReady && !user) {
      return (
         <View style={styles.gate}>
            <Text style={styles.title}>Campus Events</Text>
            <Text style={styles.gateText}>
               Connecte-toi pour découvrir les événements étudiants.
            </Text>
            <Link href='/connexion' asChild>
               <Pressable style={styles.newButton}>
                  <Text style={styles.newButtonText}>Se connecter</Text>
               </Pressable>
            </Link>
         </View>
      );
   }

   return (
      <ScrollView contentContainerStyle={styles.container}>
         <View style={styles.header}>
            <View style={styles.headerText}>
               <Text style={styles.title}>Campus Events</Text>
               <Text style={styles.subtitle}>
                  Les prochains événements étudiants
               </Text>
            </View>
            <Link href='/newevent' asChild>
               <Pressable style={styles.newButton}>
                  <FontAwesome name='plus' size={12} color='#fff' />
                  <Text style={styles.newButtonText}>Nouvel event</Text>
               </Pressable>
            </Link>
         </View>

         {loading ? (
            <Text style={styles.empty}>Chargement...</Text>
         ) : events.length === 0 ? (
            <Text style={styles.empty}>Aucun événement à venir</Text>
         ) : (
            <View style={styles.grid}>
               {events.map((e) => (
                  <View key={e.id} style={{ width: cardWidth }}>
                     <Link href={`/event/${e.id}`} asChild>
                        <Pressable style={styles.card}>
                           <Image
                              source={{ uri: e.photoURL }}
                              style={styles.cardImage}
                           />
                           <View style={styles.cardBody}>
                              <Text style={styles.cardTitle} numberOfLines={1}>
                                 {e.title}
                              </Text>
                              <View style={styles.cardMetaRow}>
                                 <FontAwesome
                                    name='calendar'
                                    size={12}
                                    color='#6b7280'
                                 />
                                 <Text style={styles.cardMeta}>
                                    {formatEventDate(e.date)}
                                 </Text>
                              </View>
                              <View style={styles.cardMetaRow}>
                                 <FontAwesome
                                    name='map-marker'
                                    size={12}
                                    color='#6b7280'
                                 />
                                 <Text
                                    style={styles.cardMeta}
                                    numberOfLines={1}
                                 >
                                    {e.location}
                                 </Text>
                              </View>
                              <View style={styles.cardFooter}>
                                 {/* Nom + photo de l'auteur, affichés systématiquement */}
                                 <View style={styles.cardAuthor}>
                                    <Avatar
                                       uri={e.createdByPhotoURL}
                                       size={22}
                                    />
                                    <Text
                                       style={styles.cardAuthorName}
                                       numberOfLines={1}
                                    >
                                       {e.createdByName ?? "Anonyme"}
                                    </Text>
                                 </View>
                                 <View style={styles.cardCount}>
                                    <FontAwesome
                                       name='users'
                                       size={12}
                                       color='#2563eb'
                                    />
                                    <Text style={styles.cardCountText}>
                                       {e.participantsCount} participant
                                       {e.participantsCount > 1 ? "s" : ""}
                                    </Text>
                                 </View>
                              </View>
                           </View>
                        </Pressable>
                     </Link>
                  </View>
               ))}
            </View>
         )}
      </ScrollView>
   );
}

const styles = StyleSheet.create({
   container: { padding: CONTAINER_PADDING, gap: 12 },
   gate: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      gap: 12,
   },
   gateText: { fontSize: 15, color: "#6b7280", textAlign: "center" },
   header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      gap: 12,
   },
   headerText: { flex: 1 },
   title: { fontSize: 28, fontWeight: "bold" },
   subtitle: { fontSize: 14, color: "#6b7280", marginTop: 2 },
   newButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#2563eb",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
   },
   newButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
   empty: {
      fontSize: 14,
      color: "#6b7280",
      textAlign: "center",
      marginTop: 40,
   },
   grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: GRID_GAP,
   },
   card: {
      backgroundColor: "#fff",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#e5e7eb",
      overflow: "hidden",
   },
   cardImage: {
      width: "100%",
      aspectRatio: 16 / 9,
      backgroundColor: "#f3f4f6",
   },
   cardBody: { padding: 14, gap: 6 },
   cardTitle: { fontSize: 17, fontWeight: "600", color: "#111827" },
   cardMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
   cardMeta: { fontSize: 13, color: "#6b7280", flex: 1 },
   cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      marginTop: 6,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: "#f3f4f6",
   },
   cardAuthor: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
   cardAuthorName: {
      fontSize: 13,
      color: "#374151",
      fontWeight: "500",
      flex: 1,
   },
   cardCount: { flexDirection: "row", alignItems: "center", gap: 6 },
   cardCountText: { fontSize: 13, fontWeight: "600", color: "#2563eb" },
});

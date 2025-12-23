'use client';
import { useState, useEffect, useRef } from 'react';
import {
  onSnapshot,
  query,
  collection,
  where,
  orderBy,
  limit,
  startAt,
  endAt,
  Query,
  doc,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

interface UseCollectionOptions {
  query?: [string, any, any];
  orderBy?: [string, 'asc' | 'desc'];
  limit?: number;
  startAt?: any;
  endAt?: any;
}

export function useCollection<T>(
  pathOrQuery: string | Query,
  options?: UseCollectionOptions
): { data: T[] | null; loading: boolean; error: FirestoreError | null } {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  const optionsRef = useRef(options);

  useEffect(() => {
    if (!pathOrQuery) {
        setLoading(false);
        setData([]);
        return;
    }
    
    let q: Query<DocumentData>;

    if (typeof pathOrQuery === 'string') {
        q = collection(firestore, pathOrQuery);
        if (optionsRef.current?.query) {
          q = query(q, where(...optionsRef.current.query));
        }
        if (optionsRef.current?.orderBy) {
          q = query(q, orderBy(...optionsRef.current.orderBy));
        }
        if (optionsRef.current?.limit) {
          q = query(q, limit(optionsRef.current.limit));
        }
        if (optionsRef.current?.startAt) {
          q = query(q, startAt(optionsRef.current.startAt));
        }
        if (optionsRef.current?.endAt) {
          q = query(q, endAt(optionsRef.current.endAt));
        }
    } else {
        q = pathOrQuery;
    }


    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const result: T[] = [];
        snapshot.forEach((doc) => {
          result.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(result);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, pathOrQuery]);

  return { data, loading, error };
}

export function useDoc<T>(
  path: string
): { data: T | null; loading: boolean; error: FirestoreError | null } {
    const firestore = useFirestore();
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<FirestoreError | null>(null);

    useEffect(() => {
        const docRef = doc(firestore, path);

        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                setData({ id: doc.id, ...doc.data() } as T);
            } else {
                setData(null);
            }
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, path]);

    return { data, loading, error };
}

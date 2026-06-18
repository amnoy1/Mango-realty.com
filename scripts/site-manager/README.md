# מנהל האתר — Mango Realty Site Manager Agent

סוכן Node.js שרץ אחת ביום ומפרסם נכסים חדשים לאתר באופן אוטומטי.

## תהליך העבודה

```
תיקיית נכסים חדשים
  └── כפר סבא רפפורט 3/
        ├── נכס/                    ← מסמכים (חוזה, שמאות וכו')
        ├── תמונות/
        │   └── תמונות נבחרות/      ← תמונות שיועלו לאתר (JPG/PNG)
        ├── [תיאור נכס].txt         ← פרטי הנכס — Claude קורא קובץ זה
        └── שיווק/                  ← חומרי שיווק
```

**הסוכן:**
1. סורק את תיקיית הנכסים לתיקיות חדשות
2. קורא את קובץ הטקסט → Claude מחלץ נתונים מובנים
3. שולח WhatsApp לאישור מנהל
4. בריצה הבאה: בודק תשובה → מעלה ל-Supabase ומפרסם

---

## התקנה

### 1. מעבר לתיקיה

```cmd
cd "c:\מנגו AI\mango-realty.com\scripts\site-manager"
```

### 2. התקנת חבילות

```cmd
npm install
```

### 3. הגדרת קובץ .env

```cmd
copy .env.example .env
```

פתח את `.env` ומלא את כל הערכים:

| משתנה | תיאור |
|-------|-------|
| `WATCH_FOLDER` | נתיב מלא לתיקיית הנכסים, לדוגמה: `C:\Desktop\נכסים חדשים` |
| `ANTHROPIC_API_KEY` | מפתח API של Claude מ-console.anthropic.com |
| `TWILIO_ACCOUNT_SID` | מ-console.twilio.com |
| `TWILIO_AUTH_TOKEN` | מ-console.twilio.com |
| `TWILIO_WHATSAPP_FROM` | מספר WhatsApp של Twilio (עם קידומת `whatsapp:`) |
| `ADMIN_WHATSAPP` | מספר הטלפון שלך (עם קידומת `whatsapp:`) |
| `NEXT_PUBLIC_SUPABASE_URL` | מ-Supabase Project Settings |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key מ-Supabase (לא `anon`) |

### 4. בדיקה ידנית

```cmd
node index.js
```

---

## הגדרת Windows Task Scheduler

### פתיחת Task Scheduler
```
Win+R → taskschd.msc → Enter
```

### יצירת משימה חדשה

1. **Action Panel** → `Create Basic Task...`

2. **Name**: `Mango Site Manager`

3. **Trigger**: `Daily` → בחר שעה (לדוגמה 09:00)

4. **Action**: `Start a program`
   - Program: `node`
   - Arguments: `"c:\מנגו AI\mango-realty.com\scripts\site-manager\index.js"`
   - Start in: `c:\מנגו AI\mango-realty.com\scripts\site-manager`

5. לחץ **Finish**

### הגדרות מתקדמות (אופציונלי)

פתח את המשימה שנוצרה → **Properties** → לשונית **Actions**:

- Program/Script: `cmd`
- Arguments:
  ```
  /c node "c:\מנגו AI\mango-realty.com\scripts\site-manager\index.js" >> "c:\מנגו AI\logs\site-manager.log" 2>&1
  ```

זה ישמור לוג יומי.

---

## הגדרת Twilio WhatsApp

### WhatsApp Sandbox (לבדיקות)
1. כנס ל-[console.twilio.com](https://console.twilio.com)
2. `Messaging` → `Try it out` → `Send a WhatsApp message`
3. שלח `join <sandbox-code>` לנייד של Twilio מהטלפון שלך
4. `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886`

### WhatsApp Business (לפרודקשן)
1. הגש בקשה ל-Twilio WhatsApp Business Profile
2. השתמש במספר שאושר

---

## מבנה state.json

הסוכן שומר מצב ב-`state.json` (נוצר אוטומטית):

```json
{
  "processed": ["כפר סבא רפפורט 3"],
  "rejected":  [],
  "pending": [
    {
      "folderName":    "רמת גן ביאליק 12",
      "folderPath":    "C:\\Desktop\\נכסים\\רמת גן ביאליק 12",
      "messageSid":    "SMxxxxx",
      "sentAt":        "2025-01-15T09:00:00.000Z",
      "extractedData": { ... }
    }
  ]
}
```

---

## אישור / דחייה ב-WhatsApp

| תשובה | פעולה |
|-------|-------|
| `אישור` | מעלה לאתר ומפרסם |
| `דחייה` | מסמן כנדחה, לא יישלח שוב |
| כל תשובה אחרת | ממתין לריצה הבאה |

---

## Supabase Storage

הסוכן מעלה תמונות ל-bucket בשם `property-images`.
צור אותו ב-Supabase Dashboard → Storage → New Bucket:
- Name: `property-images`
- Public: ✅ (כדי שהתמונות יהיו נגישות לאתר)

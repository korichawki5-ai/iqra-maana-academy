const { createClient } = require('@supabase/supabase-js');

const clean = (value, max = 200) => {
  return typeof value === "string"
    ? value.trim().replace(/[<>]/g, "").slice(0, max)
    : "";
};

const phoneOk = (phone) => {
  return /^0[5-7][0-9\s-]{8,13}$|^\+213[5-7][0-9\s-]{8,13}$/.test(phone);
};

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "الطريقة غير مسموحة." });
  }

  if ((event.body || "").length > 5000) {
    return json(413, { error: "الطلب كبير جداً." });
  }

  try {
    const body = JSON.parse(event.body || "{}");

    // حقل مخفي: إذا ملأه بوت، لا يتم حفظ الطلب
    if (clean(body.website)) {
      return json(200, { ok: true });
    }

    const data = {
      student_name: clean(body.student_name),
      parent_name: clean(body.parent_name),
      phone: clean(body.phone, 30),
      level: clean(body.level, 60),
      course_id: clean(body.course_id, 60),
      notes: clean(body.notes, 500)
    };

    if (
      !data.student_name ||
      !data.parent_name ||
      !data.phone ||
      !data.level ||
      !data.course_id
    ) {
      return json(400, {
        error: "يرجى ملء كل الحقول المطلوبة."
      });
    }

    if (
      !phoneOk(data.phone) ||
      !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(data.course_id)
    ) {
      return json(400, {
        error: "بيانات الطلب غير صحيحة."
      });
    }

    if (
      !process.env.SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      throw new Error("Server configuration missing");
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false
        }
      }
    );

    // تحقق من أن الدرس ما زال متاحاً ويتوافق مع المستوى المختار
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, status, level, seats_remaining")
      .eq("id", data.course_id)
      .single();

    if (
      courseError ||
      !course ||
      course.status !== "متاح" ||
      course.level !== data.level ||
      course.seats_remaining < 1
    ) {
      return json(400, {
        error: "هذا الدرس لم يعد متاحاً. حدّث الصفحة واختر درساً آخر."
      });
    }

    // حماية من السبام: 3 طلبات كحد أقصى لنفس الرقم خلال ساعة
    const hourAgo = new Date(Date.now() - 3600000).toISOString();

    const { count } = await supabase
      .from("registration_requests")
      .select("id", { count: "exact", head: true })
      .eq("phone", data.phone)
      .gte("created_at", hourAgo);

    if ((count || 0) >= 3) {
      return json(429, {
        error: "تم إرسال طلبات كثيرة من هذا الرقم. يرجى المحاولة لاحقاً."
      });
    }

    const { error } = await supabase
      .from("registration_requests")
      .insert(data);

    if (error) {
      throw error;
    }

    return json(201, { ok: true });
  } catch (error) {
    console.error("registration error:", error.message);

    return json(500, {
      error:
        "تعذر حفظ الطلب الآن. يرجى المحاولة لاحقاً أو التواصل عبر واتساب."
    });
  }
};

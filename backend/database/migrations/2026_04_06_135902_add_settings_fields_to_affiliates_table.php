<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('affiliates', function (Blueprint $table) {
            $table->longText('bio')->nullable();
            $table->longText('avatar')->nullable();
            $table->boolean('email_notifications')->default(true);
            $table->boolean('sms_notifications')->default(false);
            $table->boolean('marketing_emails')->default(true);
            $table->boolean('weekly_reports')->default(true);
            $table->boolean('two_factor_enabled')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('affiliates', function (Blueprint $table) {
            $table->dropColumn([
                'bio',
                'avatar',
                'email_notifications',
                'sms_notifications',
                'marketing_emails',
                'weekly_reports',
                'two_factor_enabled'
            ]);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('customer_email')->nullable()->after('reference_id');
            $table->string('customer_name')->nullable()->after('customer_email');
            $table->string('plan_name')->nullable()->after('customer_name');
            $table->string('subscription_id')->nullable()->after('plan_name');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['customer_email', 'customer_name', 'plan_name', 'subscription_id']);
        });
    }
};
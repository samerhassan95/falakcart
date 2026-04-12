<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('customer_phone')->nullable()->after('customer_name');
            $table->string('currency', 3)->default('SAR')->after('amount');
            $table->string('billing_cycle')->nullable()->after('plan_name');
            $table->bigInteger('falakcart_user_id')->nullable()->after('subscription_id');
            $table->json('webhook_data')->nullable()->after('falakcart_user_id');
        });
    }

    public function down()
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'customer_phone',
                'currency',
                'billing_cycle',
                'falakcart_user_id',
                'webhook_data'
            ]);
        });
    }
};